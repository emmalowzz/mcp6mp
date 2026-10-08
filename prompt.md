# Prompts

All prompts given to Claude Code for this project, in order.

## 1. Build the app from the master prompt and the Miro board

> Please read ACTIVENUTRI_MASTERPROMPT.md first in github repository. please use the attached miro board as part of an artefact to build the app.

Sent twice: the first time the repository was still empty, so `ACTIVENUTRI_MASTERPROMPT.md` was not there yet; the second time it had been uploaded to `main`.

Attached: a screenshot of the Miro Business Model Canvas, saved as [`docs/miro-business-model-canvas.png`](docs/miro-business-model-canvas.png) and transcribed in full in [`src/data/bmc.ts`](src/data/bmc.ts). Its headline notes:

- **Key partners:** SFA, board-certified nutritionists, Singapore Health Promotion Board (HPB), central kitchens, OneMap, delivery partner, central kitchen / cloud kitchen
- **Key activities:** free samples of food products for 1st downloads; users take a photo of the meal so the app can give the nutrition values; allow for auto-booking bots
- **Key resources:** vending machines company, logistics, nutritionist
- **Value propositions:** healthy food at your fingertips without the hassle of meal prepping alone; convenient vending machine collection near ActiveSG venues and gyms; users can book all sports activities within this one app; users can pre-set their booking of courts and activities filled
- **Customer relationships:** daily interactions, monthly summary, email vouchers / codes for discounts, app notifications, referral links
- **Channels:** Instagram, Facebook, TikTok, XHS; gym provider; Sport Singapore banners at sports stadiums
- **Customer segments:** people endeavouring to live healthier lifestyles and people who exercise; people who want to eat healthy; people who just exercised; senior citizens
- **Cost structure:** Play Store commission cut; $10,000 marketing (social media advertisement, print ads, etc.); hosting server (Cloudflare $10.47/yr); logistics $3,000
- **Revenue streams:** monthly subscription at S$1,000/month ("your health is your true value"); commission cut from cloud kitchens; massage therapist commission cut; commission cuts for using bots within the app for booking; grant funding from SG Sports (startup funds)

## 2. Put the code on main

> Please put the code in https://github.com/emmalowzz/mcp6mp main

## 3. Create this file

> create a prompt.md file in the project main

## 4. Make the site more appealing

> please make this site more user friendly and make the meals more appealing for people to want to order or join the subscription plan. currently no pictures to make people want to pay for this service/product

## 5. Keep the MCP check on the back end

> on the front end, remove any references to mcp. it is a check that i want to run on the back.

## 6. Simplify For Partners

> keep the "for partners" tab simple, remove all features except the "Partner inquiry" portion

## 7. Add a daily-needs tab with NutriBalance

> Please include a tab where it helps you put in your stats so that you can track and understand the user's personalised daily nutritional needs. It should use/integrate the MCP endpoint https://server.smithery.ai/NutriBalance/nutribalance-mcp

## 8. Show "ok" or "not ok" on /api/mcp.js

> update the /api/mcp.js to display the status of "ok" and "not ok " if the mcp is not returning any values
