# Tenno Vault ◈

A public Warframe fan resource: every Warframe, weapon, mod, relic, arcane, amp and operator —
with Steel Path & one-shot builds, farm locations, a trading guide, live game data, platinum prices,
videos, and a player-run market board.

**Unofficial fan site. Not affiliated with Digital Extremes.**

## Run it locally

No build step. Serve the folder and open it:

```bash
cd tenno-vault
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (e.g. `yourname/tenno-vault`).
2. Repo → **Settings → Pages** → Source: **Deploy from a branch** → branch `main`, folder `/` (or `/tenno-vault`).
3. Your site goes live at `https://yourname.github.io/tenno-vault/`.

## Refreshing the game data

Game data comes from the community [warframe-items](https://github.com/WFCD/warframe-items) database.
To pull the latest and rebuild the compact site files:

```bash
cd tenno-vault/data
BASE="https://cdn.jsdelivr.net/gh/WFCD/warframe-items/data/json"
for f in Warframes Primary Secondary Melee Mods Relics Arcanes; do
  curl -sL -o "$f.json" "$BASE/$f.json"
done
cd ..
node tools/build-data.js
```

Curated content (builds, amps, operators, videos, farms) lives in `data/site/*.json` —
edit those files directly to add guides.

## Setting up the marketplace (Firebase, free tier)

The market board uses Firebase Auth + Firestore so it works from a static site.
~10 minutes, no credit card:

1. Go to [firebase.google.com](https://firebase.google.com) → **Get started** → **Add project**.
   Name it `tenno-vault`, disable Google Analytics (optional), Create project.
2. **Build → Authentication → Get started** → enable **Google** as a sign-in provider
   (add your support email), Save.
3. **Build → Firestore Database → Create database** → start in **production mode**,
   pick the closest region.
4. **Firestore → Rules** tab → paste the contents of `firestore.rules` → **Publish**.
5. **Project settings (gear) → Your apps → Web (`</>`)** → register app `tenno-vault-web`.
   Copy the `firebaseConfig` values.
6. Open `js/firebase-config.js` and paste your values, then set
   `window.TV_FIREBASE_READY = true`.
7. Redeploy the site. The market board activates automatically.

> ⚠️ **Never commit real Firebase keys to a public repo.** The shipped
> `js/firebase-config.js` contains placeholders on purpose. Firebase API keys for
> Auth/Firestore are public-by-design, but keep the file honest anyway and use
> Firebase App Check if abuse becomes a problem.

## Donations

The ♥ Donate buttons point at `#donate-setup` with an HTML comment marker.
The owner replaces those `href`s with their Ko-fi / PayPal URL.

## What this site deliberately does NOT do

- **No Warframe account linking.** Digital Extremes offers no public login API,
  so no fan site can pull up what a player owns. Listings are posted manually.
- **No in-site trading of items/platinum.** The market board is classifieds only:
  players message each other, then trade **in-game** at the dojo trading post.
  Tenno Vault never holds items, platinum, or payment info.

## Credits

- Game data: [warframe-items](https://github.com/WFCD/warframe-items) (WFCD, community)
- Live world state: [warframestat.us](https://warframestat.us)
- Prices: [warframe.market](https://warframe.market)
- Build knowledge: the Warframe community (Overframe, wiki editors, creators)
