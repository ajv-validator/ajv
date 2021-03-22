#!/usr/bin/env bash

declare -a packages=(
  "ajv-keywords"
  "ajv-formats"
  "ajv-cli"
  "ajv-errors"
  "ajv-i18n"
)

for package in "${packages[@]}"
do
  echo "downloading $package README..."
  curl -L https://raw.githubusercontent.com/ajv-validator/$package/master/README.md -o ../docs/packages/$package.md
done
