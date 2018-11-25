const express = require('express');

const CryptoJS = require("crypto-js");

const fs = require('fs');

const git = require("isomorphic-git");

git.plugins.set('fs', fs)

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

let ready = false;
let soFar = 0;

const repositories= [
'https://github.com/brix/crypto-js.git',
'https://github.com/remy/nodemon.git',
'https://github.com/expressjs/express.git',
'https://github.com/isomorphic-git/isomorphic-git.git'
]

function hash(s){
	return 'git/'+CryptoJS.SHA256(s).toString(CryptoJS.enc.Hex);
}

// App
const app = express();
app.get('/', (req, res) => {
	if(!ready){
		res.send('Not ready yet'+soFar+'/'+repositories.length);
	}
	else{
		res.send(temp);
	}
});
let temp = '';
for(let i = 0;i<repositories.length;i++){
	git.clone({
		dir: hash(repositories[i]),
		url: repositories[i],
		singleBranch: true,
	}).then((value)=>{
		git.log({dir:hash(repositories[i])}).then(function(value){
			temp+=repositories[i]+": "+ value.length+'<br>\n';
			soFar+=1;
			if(soFar==repositories.length) ready = true
			console.log(value);
		}).catch((value)=>console.log(value))

	}).catch((value)=>console.log(value))
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
