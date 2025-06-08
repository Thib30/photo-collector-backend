import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import { config } from 'dotenv'
import { Buffer } from 'buffer'

config()
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// GitHub repo configuration
const REPO   = 'Thib30/photo-collector'
const BRANCH = process.env.BRANCH || 'main'
const TOKEN  = process.env.GITHUB_TOKEN

// URLs for the two data files
const GITHUB_API_MESSAGES = `https://api.github.com/repos/${REPO}/contents/data/messages.json`
const GITHUB_API_PHOTOS   = `https://api.github.com/repos/${REPO}/contents/data/photos.json`

// POST /save: save both messages.json and photos.json
app.post('/save', async (req, res) => {
  try {
    console.log("➡️ POST /save reçu")

    const messages = req.body.messages || []
    const photos   = req.body.photos   || []

    // --- Update messages.json ---
    const currentMsgFile = await fetch(GITHUB_API_MESSAGES, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json())

    const updatedMsgContent = Buffer
      .from(JSON.stringify(messages, null, 2))
      .toString('base64')

    await fetch(GITHUB_API_MESSAGES, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message:   'Update messages.json via /save',
        content:   updatedMsgContent,
        sha:       currentMsgFile.sha,
        branch:    BRANCH,
        committer: {
          name:  'Thibault Ginolin',
          email: 'thibault@example.com'
        }
      })
    })
    console.log('✅ messages.json sauvegardé')

    // --- Update photos.json ---
    const currentPhotoFile = await fetch(GITHUB_API_PHOTOS, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json())

    const updatedPhotosContent = Buffer
      .from(JSON.stringify(photos, null, 2))
      .toString('base64')

    await fetch(GITHUB_API_PHOTOS, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message:   'Update photos.json via /save',
        content:   updatedPhotosContent,
        sha:       currentPhotoFile.sha,
        branch:    BRANCH,
        committer: {
          name:  'Thibault Ginolin',
          email: 'thibault@example.com'
        }
      })
    })
    console.log('✅ photos.json sauvegardé')

    res.json({ success: true })
  } catch (err) {
    console.error('❌ Erreur POST /save :', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// GET /data: return both messages.json and photos.json
app.get('/data', async (req, res) => {
  try {
    // Load messages.json
    const msgResp = await fetch(GITHUB_API_MESSAGES, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
    const msgFile = await msgResp.json()
    const messages = msgFile.content
      ? JSON.parse(Buffer.from(msgFile.content, 'base64').toString())
      : []

    // Load photos.json
    const photoResp = await fetch(GITHUB_API_PHOTOS, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    })
    const photoFile = await photoResp.json()
    const photos = photoFile.content
      ? JSON.parse(Buffer.from(photoFile.content, 'base64').toString())
      : []

    res.json({ messages, photos })
  } catch (err) {
    console.error('❌ Erreur GET /data :', err)
    res.status(500).json({ messages: [], photos: [] })
  }
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur port ${PORT}`)
})
