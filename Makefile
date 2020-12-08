install:
  npm ci

lint:
  npx eslint .

deploy:
  npx vercel
