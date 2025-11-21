const User = require("../models/User");
const { sendEmail } = require("../utils/mail");
// GET /api/users - Get all users (with optional filters)
exports.getAllUsers = async (req, res) => {
  try {
    const { skill, location } = req.query;
    let filter = {};

    if (skill) filter.skillsOffered = { $regex: skill, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };

    const users = await User.find(filter).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id - Get single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/users/:id - Update profile (owner or admin)
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    }).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/users/:id - Delete account (admin or owner)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(req.params.id);

    await sendEmail({
      to: user.email,
      subject: "Account Deleted - SkillSwap",
      html: `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
  </head>
  <body style="font-family:Arial,Helvetica,sans-serif;background:#f6f9fc;margin:0;padding:40px;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="500" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            
            <tr>
              <td style="padding:24px;text-align:center;background:#333;color:#fff;">
                <h1 style="margin:0;font-size:22px;">SkillSwap</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:25px;color:#000;text-align:left;">
                <p style="margin:0 0 12px;font-size:15px;">Hello ${user.name},</p>

                <h2 style="margin:0 0 8px;font-size:18px;text-align:left;">Account Deleted</h2>

                <p style="margin:0;font-size:14px;color:#444;">
                  Your SkillSwap account has been deleted successfully. We’re sorry to see you go.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:14px;text-align:center;font-size:12px;color:#999;background:#fafafa;">
                SkillSwap Team
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/:id/ban - Admin bans user
exports.banUser = async (req, res) => {
  try {
    console.log(
      "Ban request from user:",
      req.user._id,
      "isAdmin:",
      req.user.isAdmin,
    );

    if (!req.user.isAdmin) {
      console.log("Non-admin user attempted to ban");
      return res.status(403).json({ message: "Admin only" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: true },
      { new: true },
    ).select("-password");

    if (!user) {
      console.log("User not found for banning:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Successfully banned user:", user._id, user.name);
    res.json({ message: "User banned successfully", user });
  } catch (error) {
    console.error("Error banning user:", error);
    res
      .status(500)
      .json({ message: "Error banning user", error: error.message });
  }
};

// POST /api/users/:id/unban - Admin unbans user
exports.unbanUser = async (req, res) => {
  try {
    console.log(
      "Unban request from user:",
      req.user._id,
      "isAdmin:",
      req.user.isAdmin,
    );

    if (!req.user.isAdmin) {
      console.log("Non-admin user attempted to unban");
      return res.status(403).json({ message: "Admin only" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned: false },
      { new: true },
    ).select("-password");

    if (!user) {
      console.log("User not found for unbanning:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Successfully unbanned user:", user._id, user.name);
    res.json({ message: "User unbanned successfully", user });
  } catch (error) {
    console.error("Error unbanning user:", error);
    res
      .status(500)
      .json({ message: "Error unbanning user", error: error.message });
  }
};

// GET /api/users/search?skill=&location= - Search API
exports.searchUsers = async (req, res) => {
  const { skill, location } = req.query;
  const filter = {};

  if (skill) filter.skillsOffered = { $regex: skill, $options: "i" };
  if (location) filter.location = { $regex: location, $options: "i" };

  const users = await User.find(filter).select("-password");
  res.json(users);
};
