const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../utils/mail");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = generateToken(user);
    await sendEmail({
      to: user.email,
      subject: "Welcome to SkillSwap!",
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
              <td style="padding:24px;text-align:center;background:#ff7a7a;color:#fff;">
                <h1 style="margin:0;font-size:22px;">SkillSwap</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:25px;color:#000;text-align:left;">
                <p style="margin:0 0 12px;font-size:15px;">Hello ${user.name},</p>

                <h2 style="margin:0 0 8px;font-size:18px;text-align:left;">Registration Successful</h2>

                <p style="margin:0;font-size:14px;color:#444;">
                  Your account has been created successfully. You can now log in and start using SkillSwap.
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
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
    console.log(err);
  }
};

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refreshToken in DB
  user.refreshTokens.push(refreshToken);
  await user.save();
  await sendEmail({
    to: user.email,
    subject: "Login Successful - SkillSwap",
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
              <td style="padding:24px;text-align:center;background:#6c63ff;color:#fff;">
                <h1 style="margin:0;font-size:22px;">SkillSwap</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:25px;color:#000;text-align:left;">
                <p style="margin:0 0 12px;font-size:15px;">Hello ${user.name},</p>

                <h2 style="margin:0 0 8px;font-size:18px;text-align:left;">Login Successful</h2>

                <p style="margin:0;font-size:14px;color:#444;">
                  Your account has been successfully logged in.
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

  res.status(200).json({
    token: accessToken,
    refreshToken,
    user,
  });
};
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = generateAccessToken(user);
    res.status(200).json({ token: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Refresh token expired or invalid" });
  }
};

exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token missing" });

  try {
    console.log("Logout request with token:", refreshToken);
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Remove this refresh token from user's list
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
    await sendEmail({
      to: user.email,
      subject: "Logout Successful - SkillSwap",
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
              <td style="padding:24px;text-align:center;background:#4fd1c5;color:#fff;">
                <h1 style="margin:0;font-size:22px;">SkillSwap</h1>
              </td>
            </tr>

            <tr>
              <td style="padding:25px;color:#000;text-align:left;">
                <p style="margin:0 0 12px;font-size:15px;">Hello ${user.name},</p>

                <h2 style="margin:0 0 8px;font-size:18px;text-align:left;">Logout Successful</h2>

                <p style="margin:0;font-size:14px;color:#444;">
                  You have been logged out of your SkillSwap account successfully.
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

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Get current user from token
exports.getMe = async (req, res) => {
  try {
    res.status(200).json(req.user); // `req.user` is populated from JWT
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
