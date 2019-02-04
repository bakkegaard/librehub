const express = require('express');
const path = require('path');
const moment = require('moment');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const git = require('nodegit-kit');
const nodegit = require("nodegit");
const argv = process.argv.slice(2);

const projects = require('../projects.json');

console.log(hash("https://github.com/jellyfin/jellyfin.git"));

// Constants
const PORT = 3000;
const HOST = '0.0.0.0';

const db = {};

let queue = [];
const queueRequests = (function () {
	let numberOfRequests = 10;
	return function (ORepository, url) {
		if (numberOfRequests !== 0) {
			getCommit(ORepository, url);
			numberOfRequests -= 1;
		}
		else {
			queue.push([ORepository, url]);
		}
	}
})();

function hash(s) {
	return CryptoJS.SHA256(s).toString(CryptoJS.enc.Hex);
}

let numberOfRepositories = 0;
let proccesed = 0;

(function () {
	projects.forEach((project) => {
		const repositories = project.repositories;
		repositories.forEach((repository) => {
			if(repository.enabled){
				numberOfRepositories+=1;
				queueRequests(repository, repository.url);
			}
		})
		console.log("#"+numberOfRepositories)
	})
})()

function createStats(commits) {

	const commitsPerMonthHashset = {};
	const contributorsPerMonthHashset = {};

	commits.forEach(element => {
		const commitDate = moment(element.date);
		const dateString = "" + commitDate.year() + "-" + commitDate.month();
		if (dateString in commitsPerMonthHashset) {
			commitsPerMonthHashset[dateString] += 1;
			if (!contributorsPerMonthHashset[dateString].has(element.author.name)) {
				contributorsPerMonthHashset[dateString].add(element.author.name);
			}
		}
		else {
			commitsPerMonthHashset[dateString] = 1;
			contributorsPerMonthHashset[dateString] = new Set()
			contributorsPerMonthHashset[dateString].add(element.author.name);
		}
	});

	const commitsPerMonthArray = [];
	const contributorsPerMonthArray = [];

	for (var dateString in commitsPerMonthHashset) {
		commitsPerMonthArray.push({ "date": dateString, "value": commitsPerMonthHashset[dateString] })
		contributorsPerMonthArray.push({ "date": dateString, "contributors": Array.from(contributorsPerMonthHashset[dateString]) })
	}
	function dateSort(e1,e2){
		let [e1_year, e1_month] = e1.split('-').map((e)=>{return parseInt(e)});
		let [e2_year, e2_month] = e2.split('-').map((e)=>{return parseInt(e)});

		if(e1_year === e2_year){
			return e1_month>e2_month;
		}
		else{
			return e1_year>e2_year;
		}
	}
	commitsPerMonthArray.sort((o1,o2)=>{return dateSort(o1.date,o2.date)});
	contributorsPerMonthArray.sort((o1,o2)=>{return dateSort(o1.date,o2.date)});

	const returnValue = {};
	returnValue.commitsPerMonth = commitsPerMonthArray;
	returnValue.contributorsPerMonth = contributorsPerMonthArray;

	const today = moment();
	const thirtyDaysAgo = moment(today).subtract(30, "days");

	const contributorsBefore30Days = new Set();
	const allContributors = new Set();
	const contributorsLast30Days = new Set();
	let commitsLast30Days = 0;

	commits.forEach((e) => {
		let author = e.author.name;
		let date = moment(e.date);
		allContributors.add(author);
		if (date.isBefore(thirtyDaysAgo)) {
			contributorsBefore30Days.add(author);
		}
		else {
			commitsLast30Days += 1;
			contributorsLast30Days.add(author);
		}
	})
	returnValue.contributorsLast30Days = Array.from(contributorsLast30Days);
	returnValue.contributorsBefore30Days = Array.from(contributorsBefore30Days);
	returnValue.allContributors = Array.from(allContributors);
	returnValue.numberOfCommits = commits.length;
	returnValue.contributorsLast30Days = contributorsLast30Days;

	return returnValue;
}
// App
const app = express().get('/', (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
})
	.get('/api/listProjects', (req, res) => {
		res.json(projects.map((e) => { return { "name": e.name } }));
	})
	.get('/project/*', (req, res) => {
		res.sendFile(__dirname + '/public/project.html');
	})
	.get('/api/project/:name', (req, res) => {
		const current = projects.find((e) => {
			return e.name === req.params.name;
		})
		res.json(current);
	})
	.use(express.static('src/public'))




function handleRequest(){
	if(queue.length!==0){
		let request = queue.pop();
		getCommit(request[0],request[1]);
	}
}

function logerror(err){
	console.log(err);
}

function getCommit(ORepository, url) {
	const { exec } = require('child_process');
	const hashRepository = hash(url);
	if (!fs.existsSync('git/' + hash(url))) {
		exec('cd git/; git clone -q '+url+' '+hashRepository, (err, stdout, stderr) => {
			if (err) {
				console.log('hmmm1');
				console.error(err);
				return;
			}
			git.open('git/'+hash(url))
				.then(function(repo){
					// git log
					return git.log(repo)
						.then(function(log){
							log.reverse();
							ORepository.stats = createStats(log);
							proccesed+=1;
							console.log('('+proccesed+'/'+numberOfRepositories+')'+' done with '+ORepository.name );
							handleRequest();
						});
				});
		})
	}
	else if(argv[0]==='update'){
		exec('cd git/'+hashRepository+'; git pull', (err, stdout, stderr) => {
			if (err) {
				console.log('hmmm2');
				console.error(err);
				return;
			}
			git.open('git/'+hash(url))
				.then(function(repo){
					// git log
					return git.log(repo)
						.then(function(log){
							log.reverse();
							ORepository.stats = createStats(log);
							proccesed+=1;
							console.log('('+proccesed+'/'+numberOfRepositories+')'+' done with '+ORepository.name );
							handleRequest();
						});
				});
		})
	}
	else{
		git.open('git/'+hash(url))
			.then(function(repo){
				// git log
				return git.log(repo)
					.then(function(log){
						log.reverse();
						ORepository.stats = createStats(log);
						proccesed+=1;
						console.log('('+proccesed+'/'+numberOfRepositories+')'+' done with '+ORepository.name );
						handleRequest();
					});
			});
	}
}

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
