FROM node:20-alpine

WORKDIR /app

COPY site/package.json site/package-lock.json ./site/
RUN npm ci --prefix site

COPY site ./site
COPY docs ./docs
COPY doc ./doc

EXPOSE 5173

CMD ["npm", "run", "dev", "--prefix", "site", "--", "--host", "0.0.0.0", "--port", "5173"]
