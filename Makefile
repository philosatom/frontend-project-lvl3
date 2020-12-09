install:
	npm ci

lint:
	npx eslint .

develop:
	npx webpack-dev-server

build:
	npm run build

deploy:
	npx vercel
