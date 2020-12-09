install:
	npm ci

lint:
	npx eslint .

develop:
	npx webpack serve

build:
	npm run build

deploy:
	npx vercel
