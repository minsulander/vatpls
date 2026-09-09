#!/bin/bash -e

user=main
host=backend.vatiris.se

cd "$(dirname "$0")/.."

rm -rf build api/build

cd api
npm install
npm run build
cd ..

mkdir -p build/src
cp -r api/build build/
cp -r api/node_modules build/
cp -r api/src/migrations build/src/

rm -f plsapi.zip
cd build
zip -r ../plsapi.zip .
cd ..

scp plsapi.zip $user@$host:
ssh $user@$host unzip -o plsapi.zip -d plsapi

# scp scripts/plsapi.service $user@$host:
# ssh $user@$host "sudo mv ~/plsapi.service /etc/systemd/system/plsapi.service"
# ssh $user@$host "sudo systemctl daemon-reload"
# ssh $user@$host "sudo systemctl enable plsapi"

ssh $user@$host "sudo systemctl restart plsapi"

rm -f plsapi.zip
echo "Deployed to $host"
echo "Don't forget migrations, if any..."
