import express from 'express'
import fetch from 'node-fetch'
import cors from 'cors'
import { config } from 'dotenv'
import { Buffer } from 'buffer'

config()
const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' })); // ou '20mb' si besoin

const REPO = 'Thib30/photo-collector'
const FILE_PATH = 'data/messages.json'
const GITHUB_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`
const TOKEN = process.env.GITHUB_TOKEN
const GITHUB_API_MESSAGES = `https://api.github.com/repos/${REPO}/contents/data/messages.json`;
const GITHUB_API_PHOTOS   = `https://api.github.com/repos/${REPO}/contents/data/photos.json`;


app.post('/save', async (req, res) => {
  try {
    console.log("➡️ POST /save reçu");

    const messages = req.body.messages || [];
    const photos   = req.body.photos   || [];

    // --- MESSAGES ---
    // 1) Lire messages.json
    const currentMsgFile = await fetch(GITHUB_API_MESSAGES, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json());
    const contentMsgDecoded = Buffer.from(currentMsgFile.content, 'base64').toString();
    // (on pourrait merger ici, mais tu passes déjà tout messages)

    // 2) Encoder et PUT messages.json
    const updatedMsg = Buffer.from(JSON.stringify(messages, null, 2)).toString('base64');
    await fetch(GITHUB_API_MESSAGES, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update messages.json via /save',
        content: updatedMsg,
        sha: currentMsgFile.sha,
        branch: GITHUB_CONFIG.branch,
        committer: { name: 'Thibault Ginolin', email: 'thibault@example.com' }
      })
    });

    console.log('✅ messages.json sauvegardé');

    // --- PHOTOS ---
    // 1) Lire photos.json
    const currentPhotoFile = await fetch(GITHUB_API_PHOTOS, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(r => r.json());
    const updatedPhotos = Buffer.from(JSON.stringify(photos, null, 2)).toString('base64');

    // 2) PUT photos.json
    await fetch(GITHUB_API_PHOTOS, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Update photos.json via /save',
        content: updatedPhotos,
        sha: currentPhotoFile.sha,
        branch: GITHUB_CONFIG.branch,
        committer: { name: 'Thibault Ginolin', email: 'thibault@example.com' }
      })
    });

    console.log('✅ photos.json sauvegardé');

    // Tout s’est bien passé
    res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur POST /save :', err);
    res.status(500).json({ success: false, error: err.message });
  }
});





// Nouvelle route : GET /data
app.get('/data', async (req, res) => {
  try {
    // Lire messages.json
    const msgResp = await fetch(GITHUB_API_MESSAGES, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const msgFile = await msgResp.json();
    const messages = msgFile.content
      ? JSON.parse(Buffer.from(msgFile.content, 'base64').toString())
      : [];

    // Lire photos.json
    const photoResp = await fetch(GITHUB_API_PHOTOS, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const photoFile = await photoResp.json();
    const photos = photoFile.content
      ? JSON.parse(Buffer.from(photoFile.content, 'base64').toString())
      : [];

    // Répondre avec les deux tableaux
    res.json({ messages, photos });

  } catch (err) {
    console.error('❌ Erreur GET /data :', err);
    res.status(500).json({ messages: [], photos: [] });
  }
});


console.log("✅ messages.json sauvegardé. Enregistrement de photos.json...");


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});


