"use client";

import Link from "next/link";

export default function Sidebar({
  onOpenRoutines,
  onOpenChats,
  onSaveRoutine,
  onGeneratePdf,
}) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-20 bg-[#0b1116] border-r border-cyan-600/10 flex flex-col items-center justify-between py-6 space-y-6 z-30">
      <div className="space-y-5">
        <Link href="/">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center">
            {/* globe svg */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 0C31.0457 0 40 8.9543 40 20C40 31.0457 31.0457 40 20 40C8.9543 40 0 31.0457 0 20C0 8.9543 8.9543 0 20 0ZM20 37.5C21.3044 37.5 23.1582 36.3776 24.835 33.0241C25.4832 31.7276 26.0432 30.2024 26.4802 28.5H13.5198C13.9568 30.2024 14.5168 31.7276 15.165 33.0241C16.8418 36.3776 18.6956 37.5 20 37.5ZM12.9908 26H27.0092C27.3247 24.1367 27.5 22.1193 27.5 20C27.5 18.0689 27.3545 16.2224 27.0899 14.5H12.9101C12.6455 16.2224 12.5 18.0689 12.5 20C12.5 22.1193 12.6753 24.1367 12.9908 26ZM29.0545 28.5C28.2829 31.7823 27.0781 34.5769 25.5876 36.589C29.7423 35.1901 33.1995 32.2743 35.3007 28.5H29.0545ZM36.4444 26C37.1274 24.1286 37.5 22.1078 37.5 20C37.5 18.0786 37.1904 16.2296 36.6182 14.5H29.6171C29.8665 16.2474 30 18.0925 30 20C30 22.0904 29.8396 24.1059 29.5422 26H36.4444ZM10.4578 26C10.1604 24.1059 10 22.0904 10 20C10 18.0925 10.1335 16.2474 10.3829 14.5H3.38176C2.80965 16.2296 2.5 18.0786 2.5 20C2.5 22.1078 2.87265 24.1286 3.55565 26H10.4578ZM4.6993 28.5C6.80052 32.2743 10.2577 35.1901 14.4124 36.589C12.9219 34.5769 11.7171 31.7823 10.9455 28.5H4.6993ZM13.3962 12H26.6038C26.151 10.0955 25.5461 8.39804 24.835 6.9759C23.1582 3.62237 21.3044 2.5 20 2.5C18.6956 2.5 16.8418 3.62237 15.165 6.9759C14.4539 8.39804 13.849 10.0955 13.3962 12ZM29.1679 12H35.5685C33.5005 7.98363 29.9239 4.87103 25.5876 3.411C27.1533 5.52456 28.4036 8.50135 29.1679 12ZM14.4124 3.411C10.0761 4.87103 6.4995 7.98363 4.43149 12H10.8321C11.5964 8.50135 12.8467 5.52456 14.4124 3.411Z"
                fill="#0468F9"
              />
            </svg>
          </div>
        </Link>
        {/* chat history */}
        <button
          className="w-10 h-10 rounded-lg hover:bg-white/2 flex items-center justify-center"
          onClick={() => onOpenChats?.()}
          title="Chat history"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 29 29"
            fill="none"
          >
            <path
              d="M12.5 7.5C12.5 6.94772 12.9477 6.5 13.5 6.5C14.0523 6.5 14.5 6.94772 14.5 7.5V14.5H18.5C19.0523 14.5 19.5 14.9477 19.5 15.5C19.5 16.0523 19.0523 16.5 18.5 16.5H13.5C12.9477 16.5 12.5 16.0523 12.5 15.5V7.5ZM14.5 28.5C22.232 28.5 28.5 22.232 28.5 14.5C28.5 6.76801 22.232 0.5 14.5 0.5C6.76801 0.5 0.5 6.76801 0.5 14.5C0.5 22.232 6.76801 28.5 14.5 28.5ZM14.5 26.5C7.87258 26.5 2.5 21.1274 2.5 14.5C2.5 7.87258 7.87258 2.5 14.5 2.5C21.1274 2.5 26.5 7.87258 26.5 14.5C26.5 21.1274 21.1274 26.5 14.5 26.5Z"
              fill="white"
              stroke="#0A0F19"
            />
          </svg>
        </button>
        {/* save routine */}
        <button
          onClick={() => onSaveRoutine?.()}
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          title="Save current chat as routine"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
        </button>
        {/* open routines svg */}
        <button
          onClick={() => onOpenRoutines?.()}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          title="View Routines"
        >
          <img src="/routine.png" className="w-8 h-8" />
        </button>
        {/* generate PDF / summary */}
        <button
          onClick={() => onGeneratePdf?.()}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          title="Download summary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 2C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V9.82843C20 9.29799 19.7893 8.78929 19.4142 8.41421L14.5858 3.58579C14.2107 3.21071 13.702 3 13.1716 3H6Z"
              stroke="white"
              strokeWidth="0.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 3V7C14 8.10457 14.8954 9 16 9H20"
              stroke="white"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 14H11"
              stroke="#0A0F19"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 17H12"
              stroke="#0A0F19"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <text
              x="12.5"
              y="18"
              textAnchor="middle"
              fill="white"
              fontSize="5"
              fontFamily="sans-serif"
            >
              PDF
            </text>
          </svg>
        </button>
        <button
          onClick={() => (window.location.href = "/image")}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
          title="Start new chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 34 32"
            fill="none"
          >
            <path
              d="M4 7.5C4 5.01472 6.01472 3 8.5 3H25.5C27.9853 3 30 5.01472 30 7.5V24.5C30 26.9853 27.9853 29 25.5 29H8.5C6.01472 29 4 26.9853 4 24.5V7.5ZM8.5 5C7.11929 5 6 6.11929 6 7.5V24.5C6 25.8807 7.11929 27 8.5 27H25.5C26.8807 27 28 25.8807 28 24.5V7.5C28 6.11929 26.8807 5 25.5 5H8.5ZM17 8C17.5523 8 18 8.44772 18 9V15H24C24.5523 15 25 15.4477 25 16C25 16.5523 24.5523 17 24 17H18V23C18 23.5523 17.5523 24 17 24C16.4477 24 16 23.5523 16 23V17H10C9.44772 17 9 16.5523 9 16C9 15.4477 9.44771 15 10 15H16V9C16 8.44772 16.4477 8 17 8Z"
              fill="white"
              stroke="#0A0F19"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      {/* user svg */}
      <Link href="/dashboard">
        <div className="mt-auto w-10 h-10 rounded-lg flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="26"
            height="26"
            viewBox="0 0 32 32"
            fill="none"
          >
            <path
              d="M23 8.99998C23 12.866 19.866 16 16 16C12.134 16 9 12.866 9 8.99998C9 5.134 12.134 2 16 2C19.866 2 23 5.134 23 8.99998ZM21 8.99998C21 6.23857 18.7614 4 16 4C13.2386 4 11 6.23857 11 8.99998C11 11.7614 13.2386 14 16 14C18.7614 14 21 11.7614 21 8.99998ZM7.5 18C5.56696 18 3.99994 19.567 4 21.5001L4.00001 22C4.00003 24.3935 5.52264 26.4174 7.68492 27.7934C9.85906 29.177 12.8015 30 15.9999 30C19.1983 30 22.1408 29.177 24.315 27.7934C26.4773 26.4174 28 24.3935 28 22V21.5C28 19.567 26.433 18 24.5 18H7.5ZM6 21.5C5.99998 20.6716 6.67156 20 7.5 20H24.5C25.3284 20 26 20.6715 26 21.5V22C26 23.4725 25.0602 24.9486 23.2413 26.1061C21.4342 27.256 18.8767 28 15.9999 28C13.1232 28 10.5657 27.256 8.75867 26.1061C6.93978 24.9486 6.00001 23.4725 6.00001 22L6 21.5Z"
              fill="#00B6DC"
            />
          </svg>
        </div>
      </Link>
    </aside>
  );
}
