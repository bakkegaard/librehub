#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const argv = process.argv.slice(2);
const rawdata = fs.readFileSync('projects.json');
const projects = JSON.parse(rawdata);
const fetch = require('node-fetch');

const first = argv[0];
const second = argv[1];
const stringSort = (a,b)=>{return ('' + a).localeCompare(b)}
function sort(){
	projects.sort((a,b)=>{ return stringSort(a.name,b.name) });
	projects.forEach((e)=>{  e.repositories.sort((a,b)=>{return stringSort(a.name,b.name) });});
}
sort();

if(first === undefined) return;
else if(first === 'add'){
	let org = second
	let githubURL = 'http://api.github.com/orgs/'+org+'/repos?per_page=100'
	if(projects.find((e)=>{return e.name === org})){
		console.log('Project '+org+' already exist');
		return;
	}
	const request = async () => {
		let jsonGithub = [];
		let done = false;
		for(let page = 1;!done;page+=1){
			const response = await fetch(githubURL+'&page='+page);
			const json = await response.json();
			if(json.length === 0) done = true;
			jsonGithub.push.apply(jsonGithub,json);
		}
		let repositories = jsonGithub.map((e)=>{return {"name" : e.name, "url": e.clone_url, "enabled": true}});
		let project = {};
		project.name = org;
		project.repositories = repositories;
		projects.push(project);
		write(projects);
		console.log("added "+ repositories.length+ " repositories!");
	}

	request();
}
else if(first==='remove'){
	const index = projects.indexOf(second);
	if (index > -1) {
	  projects.splice(index, 1);
	}
	write(projects);
}
else if(first === 'disable'){
	if(second === 'all'){
		const third = argv[2];
		const project = projects.find(function(e){return e.name === third})
		project.repositories.forEach((e)=>{e.enabled=false})
		write(projects);
	}
	else{
		const third = argv[2];
		const project = projects.find(function(e){return e.name === third})
		const repository = project.repositories.find((e)=>{return e.name === second});	
		repository.enabled = false;
		write(projects);
	}
}
else if(first === 'enable'){
	if(second === 'all'){
		const third = argv[2];
		const project = projects.find(function(e){return e.name === third})
		project.repositories.forEach((e)=>{e.enabled=true})
		write(projects);
	}
	else{ 
		const third = argv[2];
		const project = projects.find(function(e){return e.name === third})
		const repository = project.repositories.find((e)=>{return e.name === second});	
		repository.enabled = true;
		write(projects);
	}
}
else if(first === 'list'){
	if(second!==undefined){
		const project = projects.find(function(e){return e.name === second})
		const maxRepositoryNameLength = project.repositories.map((e)=>{return e.name.length}).reduce((a,b)=>{if(a>b) return a; else return b;});
		project.repositories.forEach((e)=>{
			console.log(e.name.padEnd(maxRepositoryNameLength+2)+e.enabled);
		})
	}
	else{
		const maxProjectNameLength = projects.map((e)=>{return e.name.length}).reduce((a,b)=>{if(a>b) return a; else return b;});
		projects.forEach((e)=>{
			console.log(e.name.padEnd(maxProjectNameLength+2)+e.repositories.length);
		})
	}
}
else if(first == 'count'){
	console.log(projects.find((e)=>{return e.name === second}).repositories.length);
}

sort();

function write(json){
	fs.writeFileSync('projects.json', JSON.stringify(json,null,'\t'));  
}
