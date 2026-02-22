FROM node:20-alpine

WORKDIR /app

COPY site/package.json site/package-lock.json ./site/
RUN npm ci --prefix site

COPY site ./site
COPY docs ./docs
COPY doc ./doc
COPY CHANGELOG.md ./CHANGELOG.md

RUN npm run build --prefix site

ENV NODE_ENV=production
ENV PORT=5173

EXPOSE 5173

CMD ["node", "site/build"]
