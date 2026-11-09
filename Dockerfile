FROM node:24-bookworm-slim
WORKDIR /app
COPY standalone ./standalone
COPY website/web-controls.js ./website/web-controls.js
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/data/accounts.sqlite CLINICAL_ASSETS=/data/clinical
EXPOSE 3000
CMD ["node", "standalone/server.mjs"]
