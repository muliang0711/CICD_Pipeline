you even can do a for loop in github actions 

name: CI/CD Build Matrix

on:
  push:
    branches: [ "main" ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      # This is the Matrix: It creates a "loop"
      matrix:
        app: [sender, listener]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          # It uses the variable from the matrix to find the folder
          context: ./${{ matrix.app }}
          push: true
          # It uses the variable to name the image correctly
          tags: your-username/${{ matrix.app }}-app:latest