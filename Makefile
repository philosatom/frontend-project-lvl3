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
	rm -rf dist
	NODE_ENV=production npx webpack

deploy:
	npx vercel

.PHONY: test
