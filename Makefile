install:
	npm ci

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

develop:
	npx webpack serve

build:
	npm run build

deploy:
	npx vercel

.PHONY: test
