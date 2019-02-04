
fetch('/api/project/'+document.URL.split("/").splice(-1)[0]).then((data)=>{
    return data.json();
}).then((data)=>{
  const commitsPerMonthHashmap = {};
  const contributorsPerMonthHashmap = {};
  data.repositories.forEach((repository)=>{
    repository.stats.commitsPerMonth.forEach((entry)=>{
      const dateString = entry.date;
      const value = entry.value;
      if(!(dateString in commitsPerMonthHashmap)){
        commitsPerMonthHashmap[dateString] = value;
      }
      else{
        commitsPerMonthHashmap[dateString]+=value;
      }
    })
    repository.stats.contributorsPerMonth.forEach((entry)=>{
      const dateString = entry.date;
      const contributors = entry.contributors;
      if(!(dateString in contributorsPerMonthHashmap)){
        contributorsPerMonthHashmap[dateString] = new Set(contributors);
      }
      else{
        contributorsPerMonthHashmap[dateString].addItems(contributors);
      }
    })
  })
  const commitsPerMonthData = [];
  const commitsPerMonthlabels = [];
  Object.keys(commitsPerMonthHashmap).forEach((dateString)=>{
      commitsPerMonthlabels.push(dateString);
      commitsPerMonthData.push({"x":dateString, "y": commitsPerMonthHashmap[dateString]});
  })
  chart.data.datasets[0].data = commitsPerMonthData;
  chart.data.labels = commitsPerMonthlabels;
  chart.update();

  const contributorsPerMonthData = [];
  const contributorsPerMonthlabels = [];
  Object.keys(contributorsPerMonthHashmap).forEach((dateString)=>{
      contributorsPerMonthlabels.push(dateString);
      contributorsPerMonthData.push({"x":dateString, "y": contributorsPerMonthHashmap[dateString].size});
  })
  chart2.data.datasets[0].data = contributorsPerMonthData;
  chart2.data.labels = contributorsPerMonthlabels;
  chart2.update();
})
var ctx = document.getElementById('commitsPerMonthChart').getContext('2d');
var chart = new Chart(ctx, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: [],
        datasets: [{
            label: "Commits pr. month",
            backgroundColor: 'rgb(54, 162, 235)',
            borderColor: 'rgb(54, 162, 235)',
            data: [],
            fill: false
        }]
    },

    // Configuration options go here
    options: {elements: {
				line: {
					tension: 0.000001
				}
			}
	 }
});

var ctx2 = document.getElementById('contributorsPerMonthChart').getContext('2d');
var chart2 = new Chart(ctx2, {
    // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: [],
        datasets: [{
            label: "contributors pr. month",
            backgroundColor: 'rgb(54, 162, 235)',
            borderColor: 'rgb(54, 162, 235)',
            data: [],
            fill: false
        }]
    },

    // Configuration options go here
    options: {
	 elements: {
				line: {
					tension: 0.000001
				}
			}
	 }
});


const stats = new Vue({
  el: '#stats',
  data: {
    contributors : 0,
    newContributors : 0,
    numberOfCommits : 0,
    
  },
  methods:{
    updateNewContributors : function(n){
      this.newContributors = n;
    },
    updateContributors : function(n){
      this.contributors = n;
    },
    updateNumberOfCommits : function(n){
      this.numberOfCommits = n;
    }
  }
})