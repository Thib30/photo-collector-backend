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

app.post('/save', async (req, res) => {
  try {
    console.log("➡️ POST /save reçu");

    const messages = req.body.messages || [];
    const photos = req.body.photos || [];

    // --- messages.json ---
    const currentMessages = await fetch(GITHUB_API, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(res => res.json());

    const encodedMessages = Buffer.from(JSON.stringify(messages, null, 2)).toString('base64');

    await fetch(GITHUB_API, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Mise à jour des messages',
        content: encodedMessages,
        sha: currentMessages.sha,
        committer: {
          name: 'Thibault Ginolin',
          email: 'thibault@example.com'
        }
      })
    });

    console.log("✅ messages.json sauvegardé. Enregistrement de photos.json...");

    // --- photos.json ---
    const photosUrl = GITHUB_API.replace('messages.json', 'photos.json');
    const currentPhotos = await fetch(photosUrl, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    }).then(res => res.json());

    console.log("📸 Sauvegarde photos.json avec", photos.length, "photos");
    console.log("🔍 photos à sauvegarder :", photos);

    const encodedPhotos = Buffer.from(JSON.stringify(photos, null, 2)).toString('base64');

    await fetch(photosUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Mise à jour des photos',
        content: encodedPhotos,
        sha: currentPhotos.sha,
        committer: {
          name: 'Thibault Ginolin',
          email: 'thibault@example.com'
        }
      })
    });

    res.json({ success: true });

  } catch (err) {
    console.error('❌ Erreur /save :', err);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});




// Nouvelle route : GET /data
app.get('/data', async (req, res) => {
  try {
    const githubResponse = await fetch(GITHUB_API, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });

    if (!githubResponse.ok) {
      console.error(`❌ GitHub API error: ${githubResponse.status} ${githubResponse.statusText}`);
      return res.json({ messages: [], photos: [] });
    }

    const current = await githubResponse.json();

    console.log('GitHub API response:', current); // 🧪 à surveiller dans les logs

    if (!current.content) {
      console.warn('⚠️ Aucun champ "content" dans la réponse GitHub');
      return res.json({ messages: [], photos: [] });
    }

    const contentDecoded = Buffer.from(current.content, 'base64').toString();
    const messages = JSON.parse(contentDecoded);

    res.json({ messages, photos: [] });
  } catch (err) {
    console.error('❌ Erreur réelle :', err);
    res.status(500).json({ error: 'Erreur chargement' });
  }
});

console.log("✅ messages.json sauvegardé. Enregistrement de photos.json...");


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});


