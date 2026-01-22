In Phase one , you will learn how to build out docker image and what each command mean :

File you must know : 
1. pacakage.json : what dep we need but not specific the version 
2. pacakage-lock.json : what dep we install , and what exc the version is 
3. index.js : our main program hosting on localhost:3000 


In Docker file : 

FROM node:18-alpine             // what node version and linux env we need 

WORKDIR /app                    // create a folder app if not 
                                // --> In docker angel now we are here : C:\xx\xx\xx\app
                                // --> The rest command will be execute all here  

COPY package*.json ./           // copy xx to app/
                                // --> In docker angel now we have : app/pacakage.json 
                                                             app/pacakage-lock.json 

RUN npm install --production    // you know this shit 

COPY app ./app                  // copy all file under app to docker app/ 
                                // --> In dokcer angel now we have :    app/index.js
                                                                        app/pacakage.json 
                                                                        app/pacakage-lock.json 


EXPOSE 3000                     // docker local network expose at 3000

CMD ["node", "app/index.js"]    // run command "node app/index.js"

OK after all of this : make sure you already install docker

1. run "docker build -t {docker image name you want} ./" to make docker image
--> at this point you show saw a docker image on docker hub 

2. run " docker run -p 3000:3000 --name {container name} {image name}"
--> at this point you should saw something like : your server is running on port 3000
to test the container is ok or not run : 

1. curl http://localhost:3000/health
2. curl http://localhost:3000/message

to stop and deleted the container run "docker rm -f {container name}"
Phase 1 end 
