import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Routine from "@/models/Routine";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const { title, description, prompts } = await req.json();

    if (!title || !Array.isArray(prompts) || prompts.length === 0) {
      return Response.json(
        { success: false, error: "Title and at least one prompt required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Ensure prompts have proper structure with order
    const formattedPrompts = prompts.map((p, idx) => ({
      type: p.type,
      prompt: p.prompt,
      order: p.order || idx + 1,
    }));

    const routine = new Routine({
      user: user._id,
      title,
      description: description || "",
      prompts: formattedPrompts,
      isActive: true,
      usageCount: 0,
    });

    await routine.save();

    return Response.json(
      { success: true, routine, message: "Routine created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating routine:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
