"use client";

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ChatListItem from "../../components/ChatListItem";
import ChatSection from "../../components/ChatSection";
import Loader from "../../components/Loader";
import Promptbox from "../../components/Promptbox";
import RoutinesModal from "../../components/RoutinesModal";
import SaveRoutineModal from "../../components/SaveRoutineModal";
import Sidebar from "../../components/Sidebar";
import Toast from "../../components/Toast";
import UploadCard from "../../components/UploadCard";

const Scene3D = dynamic(() => import("../../components/Scene3D"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-black" />,
});

// ============================================
// COORDINATE PARSING UTILITY FUNCTIONS
// ============================================

/**
 * Parses coordinate arrays from a response string
 * Input format: [[[x1, y1], [x2, y2], [x3, y3], [x4, y4]], ...]
 * Output format: [{C0: {x, y}, C1: {x, y}, C2: {x, y}, C3: {x, y}}, ...]
 */
function parseCoordinatesFromResponse(responseText) {
  if (!responseText || typeof responseText !== "string") {
    return [];
  }

  try {
    const startIdx = responseText.indexOf("[[[");
    if (startIdx === -1) {
      return [];
    }

    let bracketCount = 0;
    let endIdx = startIdx;

    for (let i = startIdx; i < responseText.length; i++) {
      if (responseText[i] === "[") {
        bracketCount++;
      } else if (responseText[i] === "]") {
        bracketCount--;
        if (bracketCount === 0) {
          endIdx = i + 1;
          break;
        }
      }
    }

    const coordString = responseText.substring(startIdx, endIdx);

    let parsedCoords;
    try {
      parsedCoords = JSON.parse(coordString);
    } catch (e) {
      console.error("Failed to parse coordinates JSON:", e);
      return [];
    }

    if (!Array.isArray(parsedCoords)) {
      return [];
    }

    const transformedCoords = parsedCoords
      .filter((box) => Array.isArray(box) && box.length === 4)
      .map((box) => {
        if (!box.every((point) => Array.isArray(point) && point.length === 2)) {
          return null;
        }

        return {
          C0: { x: box[0][0], y: box[0][1] },
          C1: { x: box[1][0], y: box[1][1] },
          C2: { x: box[2][0], y: box[2][1] },
          C3: { x: box[3][0], y: box[3][1] },
        };
      })
      .filter((coord) => coord !== null);

    return transformedCoords;
  } catch (error) {
    console.error("Error parsing coordinates:", error);
    return [];
  }
}

/**
 * Removes coordinate arrays from response text for cleaner display
 */
function removeCoordinatesFromResponse(responseText) {
  if (!responseText || typeof responseText !== "string") {
    return responseText;
  }

  const startIdx = responseText.indexOf("[[[");
  if (startIdx === -1) {
    return responseText;
  }

  let bracketCount = 0;
  let endIdx = startIdx;

  for (let i = startIdx; i < responseText.length; i++) {
    if (responseText[i] === "[") {
      bracketCount++;
    } else if (responseText[i] === "]") {
      bracketCount--;
      if (bracketCount === 0) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const beforeCoords = responseText.substring(0, startIdx).trim();
  const afterCoords = responseText.substring(endIdx).trim();

  let cleanedResponse = (beforeCoords + " " + afterCoords).trim();

  cleanedResponse = cleanedResponse
    .replace(/\s*coordinates?\s*:?\s*$/i, "")
    .replace(/\s*boxes?\s*:?\s*$/i, "")
    .replace(/\s*bounding\s*boxes?\s*:?\s*$/i, "")
    .trim();

  return cleanedResponse || responseText;
}

/**
 * Formats coordinates for display in response text (fallback)
 */
function formatCoordinatesForDisplay(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return "";
  }

  try {
    const formatted = coordinates
      .map((coord, index) => {
        if (coord.C0 && coord.C1 && coord.C2 && coord.C3) {
          return `Box ${index + 1}: [${coord.C0.x.toFixed(
            4
          )}, ${coord.C0.y.toFixed(4)}] → [${coord.C1.x.toFixed(
            4
          )}, ${coord.C1.y.toFixed(4)}] → [${coord.C2.x.toFixed(
            4
          )}, ${coord.C2.y.toFixed(4)}] → [${coord.C3.x.toFixed(
            4
          )}, ${coord.C3.y.toFixed(4)}]`;
        }
        return null;
      })
      .filter(Boolean);

    return formatted.length > 0
      ? "\n\nCoordinates:\n" + formatted.join("\n")
      : "";
  } catch (error) {
    console.error("Error formatting coordinates:", error);
    return "";
  }
}

/**
 * Validates if coordinates array is valid for rendering bounding boxes
 */
function areCoordinatesValidForRendering(coordinates) {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return false;
  }

  return coordinates.every((coord) => {
    if (!coord || typeof coord !== "object") return false;

    const hasAllCorners = coord.C0 && coord.C1 && coord.C2 && coord.C3;
    if (!hasAllCorners) return false;

    const allCornersValid = [coord.C0, coord.C1, coord.C2, coord.C3].every(
      (corner) =>
        corner &&
        typeof corner.x === "number" &&
        typeof corner.y === "number" &&
        !isNaN(corner.x) &&
        !isNaN(corner.y)
    );

    return allCornersValid;
  });
}

/**
 * Processes grounding response with fallback logic
 */
function processGroundingResponse(
  rawResponse,
  existingCoordinates = [],
  canRenderBoundingBoxes = true
) {
  let responseCoordinates = [];
  let displayResponse = rawResponse;

  if (
    existingCoordinates &&
    Array.isArray(existingCoordinates) &&
    existingCoordinates.length > 0
  ) {
    if (existingCoordinates[0]?.C0) {
      responseCoordinates = existingCoordinates;
    } else {
      responseCoordinates = existingCoordinates
        .filter((box) => Array.isArray(box) && box.length === 4)
        .map((box) => ({
          C0: { x: box[0][0], y: box[0][1] },
          C1: { x: box[1][0], y: box[1][1] },
          C2: { x: box[2][0], y: box[2][1] },
          C3: { x: box[3][0], y: box[3][1] },
        }));
    }
  }

  if (responseCoordinates.length === 0) {
    responseCoordinates = parseCoordinatesFromResponse(rawResponse);
  }

  displayResponse = removeCoordinatesFromResponse(rawResponse);

  const coordinatesAreValid =
    areCoordinatesValidForRendering(responseCoordinates);

  if (!canRenderBoundingBoxes || !coordinatesAreValid) {
    if (responseCoordinates.length > 0) {
      const coordsDisplay = formatCoordinatesForDisplay(responseCoordinates);
      displayResponse = displayResponse + coordsDisplay;
    }

    if (!canRenderBoundingBoxes) {
      return {
        response: displayResponse,
        coordinates: [],
      };
    }
  }

  return {
    response: displayResponse,
    coordinates: responseCoordinates,
  };
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ChatDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const chatId = params?.id;
  const [userChats, setUserChats] = useState([]);
  const [chat, setChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatListOpen, setIsChatListOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [userRoutines, setUserRoutines] = useState([]);
  const [reloadRoutines, setReloadRoutines] = useState(false);
  const [isSaveRoutineModalOpen, setIsSaveRoutineModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showToast, setShowToast] = useState(false);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(false);
  const [reloadChats, setReloadChats] = useState(false);
  const [coordinates, setCoordinates] = useState([]);
  const [selectedQueryId, setSelectedQueryId] = useState(null);
  const [isGsdPending, setIsGsdPending] = useState(false);
  const [pendingGsdPrompt, setPendingGsdPrompt] = useState("");
  const [canRenderBoundingBoxes, setCanRenderBoundingBoxes] = useState(true);
  const [thinkingQueryId, setThinkingQueryId] = useState(null);
  const gsd_keywords = [
    "area",
    "dimensions",
    "length",
    "width",
    "breadth",
    "height",
    "depth",
    "perimeter",
    "circumference",
    "radius",
    "diameter",
    "footprint",
    "volume",
    "size",
    "distance",
    "spacing",
    "extent",
    "coverage",
    "span",
    "proximity",
    "meter",
    "meters",
    "kilometer",
    "km",
    "centimeter",
    "cm",
    "feet",
    "foot",
    "ft",
    "yard",
    "yd",
    "mile",
    "mi",
    "acre",
    "acres",
    "hectare",
    "hectares",
    "sqm",
    "sqft",
  ];

  // Check if bounding box rendering is available
  useEffect(() => {
    const checkRenderingCapability = () => {
      try {
        const svgSupported = !!document.createElementNS;
        const canvas = document.createElement("canvas");
        const canvasSupported = !!(
          canvas.getContext && canvas.getContext("2d")
        );

        setCanRenderBoundingBoxes(svgSupported && canvasSupported);
      } catch (e) {
        console.error("Error checking rendering capability:", e);
        setCanRenderBoundingBoxes(false);
      }
    };

    checkRenderingCapability();
  }, []);

  const fetchChatData = useCallback(async () => {
    if (!chatId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/chats/${chatId}/get`, {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch chat");
        return;
      }

      const chatData = data.chats;

      if (!chatData) {
        setError("Chat not found");
        return;
      }

      setChat(chatData);
      setActiveChat(chatData);
      setImageUrl(chatData.imageUrl);

      setCoordinates([]);

      if (chatData.responses && chatData.responses.length > 0) {
        const typeMap = {
          captioning: "Captioning",
          grounding: "Grounding",
          vqa: "VQA",
        };

        const formattedMessages = chatData.responses.map((r) => {
          const responseText =
            typeof r.response === "string"
              ? r.response
              : JSON.stringify(r.response, null, 2);

          let responseCoordinates = [];
          let displayResponse = responseText;

          if (r.type?.toLowerCase() === "grounding") {
            if (r.coordinates && r.coordinates.length > 0) {
              responseCoordinates = r.coordinates;
              displayResponse = responseText;
            } else {
              responseCoordinates = parseCoordinatesFromResponse(responseText);
              displayResponse = removeCoordinatesFromResponse(responseText);
            }

            const coordinatesValid =
              areCoordinatesValidForRendering(responseCoordinates);
            if (!canRenderBoundingBoxes || !coordinatesValid) {
              if (
                responseCoordinates.length > 0 &&
                !displayResponse.includes("Coordinates:")
              ) {
                displayResponse =
                  displayResponse +
                  formatCoordinatesForDisplay(responseCoordinates);
              }
            }
          }

          return {
            id: r._id || Date.now() + Math.random(),
            query: r.prompt || "",
            response: displayResponse,
            category: typeMap[r.type?.toLowerCase()] || "Captioning",
            timestamp: r.timestamp || new Date(),
            coordinates: responseCoordinates,
          };
        });

        setChatHistory(formattedMessages);
      }
    } catch (err) {
      console.error("Error fetching chat:", err);
      setError("Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [chatId, canRenderBoundingBoxes]);

  const sendMessage = async (message, category) => {
    if (!message.trim() || !imageUrl) return;

    const msg = message.trim();
    const tempId = Date.now();
    let finalCategory = category || "Captioning";

    if (!isGsdPending) {
      const containsGsd = gsd_keywords.some((word) =>
        msg.toLowerCase().includes(word.toLowerCase())
      );
      if (containsGsd) {
        setPendingGsdPrompt(msg);
        setIsGsdPending(true);
        finalCategory = "area";
        setSelectedCategory("area");
        const tempChat = {
          id: tempId,
          query: msg,
          response: "Please give us the GSD in meter per pixel.",
          timestamp: new Date(),
          category: finalCategory,
          error: false,
          coordinates: [],
        };
        setChatHistory((prev) => [...prev, tempChat]);
        setInputMessage("");
        return;
      }
    }

    if (isGsdPending) {
      const scaleValue = parseFloat(msg);

      if (isNaN(scaleValue)) {
        const tempChat = {
          id: tempId,
          query: msg,
          response: "Please enter a valid number for scale.",
          timestamp: new Date(),
          category: finalCategory,
          error: true,
          coordinates: [],
        };
        setChatHistory((prev) => [...prev, tempChat]);
        setInputMessage("");
        return;
      }

      const combinedPrompt = `${pendingGsdPrompt} | SCALE: ${scaleValue}`;

      setIsGsdPending(false);
      setPendingGsdPrompt("");
      const tempChat = {
        id: tempId,
        query: msg,
        response: "",
        timestamp: new Date(),
        category: finalCategory,
        error: false,
        coordinates: [],
        isThinking: true,
      };
      setChatHistory((prev) => [...prev, tempChat]);
      setThinkingQueryId(tempId);
      setInputMessage("");
      await processFinalPrompt(combinedPrompt, finalCategory, tempId);
      return;
    }

    const tempChat = {
      id: tempId,
      query: msg,
      response: "",
      timestamp: new Date(),
      category: finalCategory,
      error: false,
      coordinates: [],
      isThinking: true,
    };
    setChatHistory((prev) => [...prev, tempChat]);
    setThinkingQueryId(tempId);
    setInputMessage("");

    try {
      setIsAnalyzing(true);

      const categoryLower = finalCategory.toLowerCase();
      const categoryUpper = finalCategory.toUpperCase();

      const mlRes = await fetch("/api/ml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, query: msg, type: categoryUpper }),
      });

      const mlData = await mlRes.json();
      console.log("ML Response:", mlData);

      if (!mlRes.ok) throw new Error(mlData.error || "Error from ML model");

      let aiResponse = "";
      let responseCoordinates = [];

      if (categoryLower === "captioning") {
        aiResponse =
          mlData.caption || mlData.response || JSON.stringify(mlData);
      } else if (categoryLower === "grounding") {
        const rawResponse =
          mlData.description || mlData.response || JSON.stringify(mlData);

        const processedResult = processGroundingResponse(
          rawResponse,
          mlData.coordinates || [],
          canRenderBoundingBoxes
        );

        aiResponse = processedResult.response;
        responseCoordinates = processedResult.coordinates;

        console.log("Parsed coordinates:", responseCoordinates);
        console.log("Can render bounding boxes:", canRenderBoundingBoxes);
      } else if (categoryLower === "vqa") {
        aiResponse = mlData.answer || mlData.response || JSON.stringify(mlData);
      } else {
        const rawResponse = mlData.response || JSON.stringify(mlData);
        const processedResult = processGroundingResponse(
          rawResponse,
          mlData.coordinates || [],
          canRenderBoundingBoxes
        );
        aiResponse = processedResult.response;
        responseCoordinates = processedResult.coordinates;
      }

      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                ...c,
                response: aiResponse,
                coordinates: responseCoordinates,
                error: false,
                isThinking: false,
              }
            : c
        )
      );

      setThinkingQueryId(null);
      const res = await fetch("/api/chats/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageUrl,
          routineId: null,
          responses: [
            {
              type: categoryLower,
              prompt: msg,
              response: removeCoordinatesFromResponse(aiResponse),
              coordinates:
                categoryLower === "grounding" || responseCoordinates.length > 0
                  ? responseCoordinates
                  : [],
            },
          ],
          metadata: {
            uploadedAt: chat?.metadata?.uploadedAt || new Date(),
            processingTime: 0,
            imageSize: chat?.metadata?.imageSize || "2000x2000",
          },
        }),
      });

      setSelectedCategory("");

      const data = await res.json();

      if (!res.ok || !data.success) {
        setChatHistory((prev) =>
          prev.map((c) =>
            c.id === tempId
              ? {
                  ...c,
                  response: data.error || "Error saving chat",
                  error: true,
                  isThinking: false,
                }
              : c
          )
        );
        setThinkingQueryId(null);
        return;
      }
    } catch (error) {
      console.error(error);
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                ...c,
                response: error.message || "Error processing request",
                error: true,
                isThinking: false,
              }
            : c
        )
      );
      setThinkingQueryId(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processFinalPrompt = async (prompt, category, tempId) => {
    try {
      setIsAnalyzing(true);
      const categoryLower = category.toLowerCase();
      const categoryUpper = category.toUpperCase();

      const mlRes = await fetch("/api/ml", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, query: prompt, type: categoryUpper }),
      });

      const mlData = await mlRes.json();
      if (!mlRes.ok) throw new Error(mlData.error || "Error from ML model");

      let aiResponse = "";
      let responseCoordinates = [];

      if (categoryLower === "captioning") {
        aiResponse = mlData.caption || mlData.response;
      } else if (categoryLower === "grounding") {
        const rawResponse = mlData.description || mlData.response;
        const processedResult = processGroundingResponse(
          rawResponse,
          mlData.coordinates || [],
          canRenderBoundingBoxes
        );
        aiResponse = processedResult.response;
        responseCoordinates = processedResult.coordinates;
      } else if (categoryLower === "vqa") {
        aiResponse = mlData.answer || mlData.response;
      } else {
        const rawResponse = mlData.response;
        const processedResult = processGroundingResponse(
          rawResponse,
          mlData.coordinates || [],
          canRenderBoundingBoxes
        );
        aiResponse = processedResult.response;
        responseCoordinates = processedResult.coordinates;
      }

      await fetch("/api/chats/update", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl,
          routineId: null,
          responses: [
            {
              type: categoryLower,
              prompt: prompt,
              response: removeCoordinatesFromResponse(aiResponse),
              coordinates: responseCoordinates,
            },
          ],
          metadata: {
            uploadedAt: chat?.metadata?.uploadedAt || new Date(),
            processingTime: 0,
            imageSize: chat?.metadata?.imageSize || "2000x2000",
          },
        }),
      });

      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                ...c,
                response: aiResponse,
                coordinates: responseCoordinates,
                isThinking: false,
              }
            : c
        )
      );
      setThinkingQueryId(null);
    } catch (err) {
      setChatHistory((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? { ...c, response: err.message, error: true, isThinking: false }
            : c
        )
      );
      setThinkingQueryId(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "loading" || !chatId) {
      return;
    }

    fetchChatData();
  }, [status, chatId, router, fetchChatData]);

  useEffect(() => {
    if (!session) return;

    const preloadChats = async () => {
      try {
        const res = await fetch("/api/chats/get", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        if (data.success) {
          setUserChats(data.chats);
        }
      } catch (err) {
        console.error("Failed to preload chats:", err);
      }
    };

    preloadChats();
  }, [session, reloadChats]);

  useEffect(() => {
    if (!session) return;

    const loadRoutines = async () => {
      try {
        const res = await fetch("/api/routines/get", {
          method: "GET",
          credentials: "include",
        });

        const data = await res.json();
        if (data.success) {
          setUserRoutines(data.routines);
        }
      } catch (err) {
        console.error("Failed to load routines:", err);
      }
    };

    loadRoutines();
  }, [session, reloadRoutines]);

  if (status === "loading" || loading) {
    return <Loader />;
  }

  if (!session) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{error}</div>
          <button
            onClick={() => router.push("/image")}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Go Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const handleImageSelect = (file, cloudUrl) => {
    setImageUrl(cloudUrl);
  };

  const handleQueryClick = (chatItem) => {
    setSelectedQueryId(chatItem.id);

    if (
      chatItem.category === "Grounding" &&
      chatItem.coordinates &&
      chatItem.coordinates.length > 0 &&
      canRenderBoundingBoxes &&
      areCoordinatesValidForRendering(chatItem.coordinates)
    ) {
      setCoordinates(chatItem.coordinates);
      console.log("Setting coordinates:", chatItem.coordinates);
      setSelectedCategory("Grounding");
    } else {
      setCoordinates([]);
      setSelectedCategory("");
    }
  };

  const handleGenerateSummaryPdf = async () => {
    if (!imageUrl || chatHistory.length === 0) {
      setToastMessage("No image or chat history to summarize");
      setToastType("error");
      setShowToast(true);
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");

      const loadImageElement = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const getVerticesFromBox = (box) => {
        let vertices = [];
        if (Array.isArray(box)) {
          vertices = box;
        } else if (box && typeof box === "object") {
          if (box.C0 && box.C1 && box.C2 && box.C3) {
            vertices = [box.C0, box.C1, box.C2, box.C3];
          } else {
            vertices = Object.values(box).filter(
              (v) => v && typeof v === "object" && "x" in v && "y" in v
            );
          }
        }
        return vertices.filter(
          (v) =>
            v &&
            typeof v === "object" &&
            typeof v.x === "number" &&
            typeof v.y === "number"
        );
      };

      const createGroundingOverlay = async (baseImgSrc, boxes) => {
        const imgEl = await loadImageElement(baseImgSrc);
        const canvas = document.createElement("canvas");
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgEl, 0, 0);

        boxes.forEach((box) => {
          const vertices = getVerticesFromBox(box);
          if (vertices.length < 4) return;

          const isNormalized = vertices.some((v) => v.x <= 1 && v.y <= 1);

          ctx.beginPath();
          vertices.forEach((v, index) => {
            const x = isNormalized ? v.x * canvas.width : v.x;
            const y = isNormalized ? v.y * canvas.height : v.y;
            if (index === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          });
          ctx.closePath();
          ctx.fillStyle = "rgba(0, 238, 44, 0.15)";
          ctx.strokeStyle = "#00EE2C";
          ctx.lineWidth = 4;
          ctx.fill();
          ctx.stroke();
        });

        return canvas.toDataURL("image/jpeg", 0.9);
      };

      const baseImgEl = await loadImageElement(imageUrl);
      const baseCanvas = document.createElement("canvas");
      baseCanvas.width = baseImgEl.naturalWidth;
      baseCanvas.height = baseImgEl.naturalHeight;
      const baseCtx = baseCanvas.getContext("2d");
      baseCtx.drawImage(baseImgEl, 0, 0);
      const baseImgDataUrl = baseCanvas.toDataURL("image/jpeg", 0.9);

      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const usableWidth = pageWidth - margin * 2;

      const addNewPageIfNeeded = (requiredHeight) => {
        if (currentY + requiredHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
      };

      let currentY = margin;

      doc.setFontSize(20);
      doc.text("Chat Summary", margin, currentY);
      currentY += 26;

      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text(
        "Image overview with user's prompts and AI answers.",
        margin,
        currentY
      );
      currentY += 18;

      const imgDisplayWidth = usableWidth;
      const imgDisplayHeight =
        (baseCanvas.height * imgDisplayWidth) / baseCanvas.width;

      addNewPageIfNeeded(imgDisplayHeight + 20);
      doc.addImage(
        baseImgDataUrl,
        "JPEG",
        margin,
        currentY,
        imgDisplayWidth,
        imgDisplayHeight
      );
      currentY += imgDisplayHeight + 24;

      doc.setTextColor(0);
      doc.setFontSize(12);

      for (let i = 0; i < chatHistory.length; i++) {
        const item = chatHistory[i];

        const question = `Q${i + 1}: ${item.query || ""}`;
        const answer = item.response || "";

        const questionLines = doc.splitTextToSize(question, usableWidth);
        const answerLines = doc.splitTextToSize(answer, usableWidth);

        let blockHeight =
          questionLines.length * 16 + 20 + answerLines.length * 14 + 16;

        const hasGrounding =
          item.category === "Grounding" &&
          item.coordinates &&
          item.coordinates.length > 0 &&
          areCoordinatesValidForRendering(item.coordinates);

        if (hasGrounding) {
          blockHeight += imgDisplayHeight + 16;
        }

        addNewPageIfNeeded(blockHeight);

        doc.setFontSize(13);
        doc.setTextColor(30);
        doc.text(questionLines, margin, currentY);
        currentY += questionLines.length * 16 + 6;

        if (hasGrounding) {
          const overlayDataUrl = await createGroundingOverlay(
            imageUrl,
            item.coordinates
          );

          addNewPageIfNeeded(imgDisplayHeight + 16);
          doc.addImage(
            overlayDataUrl,
            "JPEG",
            margin,
            currentY,
            imgDisplayWidth,
            imgDisplayHeight
          );
          currentY += imgDisplayHeight + 10;
        }

        doc.setFontSize(11);
        doc.setTextColor(22, 197, 94);
        doc.text("Answer", margin, currentY);
        currentY += 14;

        doc.setFontSize(11);
        doc.setTextColor(60);
        doc.text(answerLines, margin, currentY);
        currentY += answerLines.length * 14 + 16;
      }

      doc.save("chat-summary.pdf");
    } catch (err) {
      console.error("Failed to generate PDF", err);
      setToastMessage("Failed to generate PDF");
      setToastType("error");
      setShowToast(true);
    }
  };

  const loadUserChats = async () => {
    try {
      const res = await fetch("/api/chats/get", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();

      if (!data.success) {
        console.error("Error fetching chats:", data.error);
        return;
      }
      setUserChats(data.chats);
      setIsChatListOpen(true);
    } catch (err) {
      console.error("Failed to load chats:", err);
    }
  };

  const openChat = (selectedChat) => {
    router.push(`/chat/${selectedChat._id}`);
  };

  const saveCurrentChatAsRoutine = async (
    routineTitle,
    routineDescription = ""
  ) => {
    if (chatHistory.length === 0) {
      throw new Error("No chat history to save");
    }

    try {
      const prompts = chatHistory.map((msg, idx) => ({
        type: msg.category.toLowerCase(),
        prompt: msg.query,
        order: idx + 1,
      }));

      const res = await fetch("/api/routines/create", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: routineTitle,
          description: routineDescription,
          prompts,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save routine");
      }

      setReloadRoutines((prev) => !prev);
      setIsSaveRoutineModalOpen(false);
      setToastMessage(`Routine "${routineTitle}" saved successfully!`);
      setToastType("success");
      setShowToast(true);
    } catch (err) {
      console.error("Error saving routine:", err);
      setToastMessage(err.message || "Failed to save routine");
      setToastType("error");
      setShowToast(true);
      throw err;
    }
  };

  const handleSelectRoutine = async (selectedPrompts, routine) => {
    console.log("Routine selected:", routine);
    console.log("Selected prompts:", selectedPrompts);
    if (!imageUrl) {
      setToastMessage("Please ensure an image is loaded");
      setToastType("error");
      setShowToast(true);
      return;
    }
    if (!selectedPrompts || selectedPrompts.length === 0) {
      setToastMessage("No prompts selected");
      setToastType("error");
      setShowToast(true);
      return;
    }
    const sortedPrompts = [...selectedPrompts].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    setIsAnalyzing(true);
    setToastMessage(
      `Running routine "${routine.title}" with ${sortedPrompts.length} prompts...`
    );
    setToastType("success");
    setShowToast(true);
    for (let i = 0; i < sortedPrompts.length; i++) {
      const prompt = sortedPrompts[i];
      const category =
        prompt.type.charAt(0).toUpperCase() + prompt.type.slice(1);

      try {
        await sendMessage(prompt.prompt, category);

        if (i < sortedPrompts.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`Error executing prompt ${i + 1}:`, error);
      }
    }
    setIsAnalyzing(false);
    setToastMessage(`Routine "${routine.title}" completed!`);
    setToastType("success");
    setShowToast(true);
    try {
      await fetch("/api/routines/update-usage", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ routineId: routine._id }),
      });
    } catch (err) {
      console.error("Failed to update routine usage:", err);
    }
  };

  const handleSaveRoutineClick = () => {
    if (chatHistory.length === 0) {
      alert("No chat history to save as routine");
      return;
    }

    setIsSaveRoutineModalOpen(true);
  };

  return (
    <div className="min-h-screen text-white overflow-hidden relative bg-black">
      <Scene3D />

      <Sidebar
        onOpenRoutines={() => setIsRoutinesOpen(true)}
        onOpenChats={loadUserChats}
        onSaveRoutine={handleSaveRoutineClick}
        onGeneratePdf={handleGenerateSummaryPdf}
      />

      <main className="relative z-20 ml-20">
        <div className="max-w-7xl mx-auto px-6 pt-9 flex gap-8">
          <div className="w-[800px] flex items-center justify-center">
            <UploadCard
              onImageSelect={handleImageSelect}
              imagePreview={chat?.croppedUrl || imageUrl}
              originalImageUrl={imageUrl}
              showChangeImageButton={false}
              coordinates={coordinates}
              setBoundingBox={Boolean(
                selectedQueryId &&
                  coordinates.length > 0 &&
                  selectedCategory === "Grounding" &&
                  canRenderBoundingBoxes
              )}
              onCropComplete={fetchChatData}
            />
          </div>

          <ChatSection
            chatHistory={chatHistory}
            onQueryClick={handleQueryClick}
            selectedQueryId={selectedQueryId}
            thinkingQueryId={thinkingQueryId}
          />
        </div>
        {isChatListOpen && (
          <div className="fixed right-0 top-0 h-full w-80 bg-[#0f1720] border-l border-cyan-800/20 p-4 overflow-y-auto z-50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500 ">
                Your Chats
              </h2>

              <button
                onClick={() => setIsChatListOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {userChats.map((chat) => (
              <ChatListItem
                key={chat._id}
                chat={chat}
                isActive={activeChat?._id === chat._id}
                onOpenChat={openChat}
                onRename={async (chatId, newTitle) => {
                  const res = await fetch("/api/chats/update-title", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chatId, title: newTitle }),
                  });
                  const data = await res.json();
                  if (data.success) setReloadChats((prev) => !prev);
                }}
                onDelete={async (chatIdToDelete) => {
                  const res = await fetch("/api/chats/delete", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ chatId: chatIdToDelete }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setReloadChats((prev) => !prev);
                    if (
                      activeChat?._id === chatIdToDelete ||
                      chatId === chatIdToDelete
                    ) {
                      router.push("/image");
                    }
                  }
                }}
              />
            ))}
          </div>
        )}
      </main>

      <div className="relative z-10 text-center">
        <Promptbox
          value={inputMessage}
          onChange={(v) => setInputMessage(v)}
          onSend={(message, category) => sendMessage(message, category)}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      <RoutinesModal
        open={isRoutinesOpen}
        onClose={() => setIsRoutinesOpen(false)}
        routines={userRoutines}
        onSelectRoutine={handleSelectRoutine}
      />

      <SaveRoutineModal
        open={isSaveRoutineModalOpen}
        onClose={() => setIsSaveRoutineModalOpen(false)}
        onSave={saveCurrentChatAsRoutine}
        promptCount={chatHistory.length}
      />

      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        duration={3500}
      />
    </div>
  );
}
