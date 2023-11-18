.PHONY: build

export VERSION
build:
	yarn install
	if [ -z $${$VERSION+x} ]; then yarn version --no-git-tag-version --new-version $$VERSION;fi
	yarn run electron-forge make --platform linux --targets '@electron-forge/maker-zip'