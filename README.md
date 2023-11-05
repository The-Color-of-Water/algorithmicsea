# Color of Water: Algorithmic Sea

This folder contains the backend of the Algorithmic Sea project.

https://www.algorithmicsea.com/


## Install

#### 1. Install node modules

```npm install```

#### 2. Install Database

Install MongoDB
https://www.mongodb.com/try/download/community

Create a empty Database and the CollectionDb

#### 3. Create .env File

Create .env file at the project root folder

```
URI=mongodb://127.0.0.1:27017
dbName=algosea
collectionName=algosea
PORT=80
```

#### 4. Create the image folder

Create an empty folder at the project root folder called ```imgs```


#### 5. Create a Google Vision API access

https://cloud.google.com/docs/authentication/getting-started

https://cloud.google.com/docs/authentication/provide-credentials-adc#local-dev


##### 5.1 Create the credentials

After installing and configuring a Google API Project, you gonna need to load the credentials.

https://cloud.google.com/docs/authentication/application-default-credentials

https://cloud.google.com/docs/authentication/provide-credentials-adc

Run ```gcloud auth login``` and ```gcloud auth application-default login```

You may need to configure a quota for running the project

Run ```gcloud auth application-default set-quota-project YOUR_PROJECT_NAME```


## Running

```npm start```