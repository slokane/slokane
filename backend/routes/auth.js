const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');

const pool = require('../db');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function sanitizeUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    created_at: row.created_at,
  };
}

router.post('/signup', async (req, res) => {
  try {
    const { name = '', email = '', phone = '', password = '' } = req.body || {};

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone.trim();

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name.trim(), normalizedEmail, normalizedPhone, hashedPassword]
    );

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = sanitizeUser(rows[0]);
    const token = signToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
      token,
    });
  } catch (err) {
    console.error('[auth/signup ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.post('/signin', async (req, res) => {
  try {
    const { email = '', password = '' } = req.body || {};

    if (!email.trim() || !password.trim()) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const userRow = rows[0];
    const isMatch = await bcrypt.compare(password, userRow.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Wrong password.' });
    }

    const user = sanitizeUser(userRow);
    const token = signToken(user);

    return res.json({
      success: true,
      message: 'Login success.',
      user,
      token,
    });
  } catch (err) {
    console.error('[auth/signin ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user: sanitizeUser(rows[0]) });
  } catch (err) {
    console.error('[auth/me ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name = '', phone = '' } = req.body || {};

    if (!name.trim() || !phone.trim()) {
      return res.status(400).json({ success: false, message: 'Name and phone are required.' });
    }

    await pool.execute(
      'UPDATE users SET name = ?, phone = ? WHERE id = ?',
      [name.trim(), phone.trim(), req.user.id]
    );

    const [rows] = await pool.execute(
      'SELECT id, name, email, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: sanitizeUser(rows[0]),
    });
  } catch (err) {
    console.error('[auth/profile ERROR]', err.message);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});

router.get('/protected', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Protected route working',
    user: req.user,
  });
});

module.exports = router;
