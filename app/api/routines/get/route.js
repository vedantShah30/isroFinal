import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Routine from "@/models/Routine";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const routines = await Routine.find({ user: user._id })
      .sort({ updatedAt: -1 })
      .lean();

    return Response.json({ success: true, routines }, { status: 200 });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
