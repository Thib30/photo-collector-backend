import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import { config } from 'dotenv'
import { Buffer } from 'buffer'

config()
const app = express()
app.use(cors())
app.use(express.json())

const REPO = 'Thib30/photo-collector'
const FILE_PATH = 'data/messages.json'
const GITHUB_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`
const TOKEN = process.env.GITHUB_TOKEN

app.post('/add-message', async (req, res) => {
  const newMessage = req.body
  try {
    // Lire le fichier actuel
    const current = await fetch(GITHUB_API, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(res => res.json())

    const contentDecoded = Buffer.from(current.content, 'base64').toString()
    const messages = JSON.parse(contentDecoded)
    messages.push(newMessage)

    const updatedContent = Buffer.from(JSON.stringify(messages, null, 2)).toString('base64')

    // Mettre à jour le fichier sur GitHub
    const response = await fetch(GITHUB_API, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Ajout automatique via formulaire',
        content: updatedContent,
        sha: current.sha,
        committer: {
          name: 'Thibault Ginolin',
          email: 'thibault@example.com'
        }
      })
    })

    const result = await response.json()
    res.json({ success: true, result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de l’ajout' })
  }
})

// ... tout ton code précédent ...

// Nouvelle route : GET /data
app.get('/data', async (req, res) => {
  try {
    const current = await fetch(GITHUB_API, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(res => res.json())

    const contentDecoded = Buffer.from(current.content, 'base64').toString()
    const messages = JSON.parse(contentDecoded)

    res.json({
      messages,
      photos: []
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur chargement' })
  }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});


