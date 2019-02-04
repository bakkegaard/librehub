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
Set.prototype.addItems = function (array) {
  for (var item of array) {
    this.add(item)
  }
}
//List component
const List = {
  template: ` 
            <ul>
                <li v-for="project in projects">
                    <router-link v-bind:to="getUrl(project.name)" >{{project.name}}</router-link>
                </li>
            </ul>
            `,
  data: function () { return { projects: [] } },
  created: function () {
    this.fetchData();
  },
  methods: {
    fetchData: function () {
      fetch('/api/listProjects').then((data) => {
        return data.json()
      }).then((data) => {
        this.projects = data;
      })
    },
    getUrl: function (name) {
      return '/project/' + name;
    }

  }
}

//Project component
const Project = {
  template: `
      <div>
      <h2>{{$route.params.name}}</h2>
      <canvas id="commitsPerMonthChart" width="100" height="100"></canvas>
      <canvas id="contributorsPerMonthChart" width="100" height="100"></canvas>
      <div id="stats">
      <h2>Last 30 days</h2>
        In the last thirty days there have been {{numberOfCommitsLast30days}} commits, made by {{contributorsLast30days}} contributors,
         where {{newContributorsLast30Days}} of them were new.
      <h2>Last 12 months</h2>
      <h2>All time</h2>
      Total is {{allCommits}}, made by {{allContributors}}
      </div>
      </div>
      `
  ,
  created: function () {
    this.fetchData();
  },
  data: function () {
    return {
      numberOfCommitsLast30days: 0,
      contributorsLast30Days: 0,
      newContributorsLast30Days: 0,
      allCommits: 0,
      allContributors: 0

    }
  },
  methods: {
    fetchData: function () {
      const projectName = this.$route.params.name;
      fetch('/api/project/' + projectName).then((data) => {
        return data.json();
      }).then((data) => {
        this.setupChart();
        const commitsPerMonthHashmap = {};
        const contributorsPerMonthHashmap = {};
        data.repositories.forEach((repository) => {
			if(repository.enabled){
          repository.stats.commitsPerMonth.forEach((entry) => {
            const dateString = entry.date;
            const value = entry.value;
            if (!(dateString in commitsPerMonthHashmap)) {
              commitsPerMonthHashmap[dateString] = value;
            }
            else {
              commitsPerMonthHashmap[dateString] += value;
            }
          })
          repository.stats.contributorsPerMonth.forEach((entry) => {
            const dateString = entry.date;
            const contributors = entry.contributors;
            if (!(dateString in contributorsPerMonthHashmap)) {
              contributorsPerMonthHashmap[dateString] = new Set(contributors);
            }
            else {
              contributorsPerMonthHashmap[dateString].addItems(contributors);
            }
          })
			}
        })
        const commitsPerMonthData = [];
        const commitsPerMonthlabels = [];
        Object.keys(commitsPerMonthHashmap).forEach((dateString) => {
          commitsPerMonthlabels.push(dateString);
          commitsPerMonthData.push({ "x": dateString, "y": commitsPerMonthHashmap[dateString] });
        })
        commitsPerMonthData.sort((o1,o2)=>{return dateSort(o1.x,o2.x)});
        commitsPerMonthlabels.sort(dateSort);

        this.chart.data.datasets[0].data = commitsPerMonthData;
        this.chart.data.labels = commitsPerMonthlabels;
        this.chart.update();

        const contributorsPerMonthData = [];
        const contributorsPerMonthlabels = [];
        Object.keys(contributorsPerMonthHashmap).forEach((dateString) => {
          contributorsPerMonthlabels.push(dateString);
          contributorsPerMonthData.push({ "x": dateString, "y": contributorsPerMonthHashmap[dateString].size });
        })

        contributorsPerMonthData.sort((o1,o2)=>{return dateSort(o1.x,o2.x)});
        contributorsPerMonthlabels.sort(dateSort);

        this.chart2.data.datasets[0].data = contributorsPerMonthData;
        this.chart2.data.labels = contributorsPerMonthlabels;
        this.chart2.update();

        const contributorsLast30DaysSet = new Set();
        const contributorsBefore30Days = new Set();
        let totalCommits = 0;
        data.repositories.forEach((repository)=>{
          contributorsLast30DaysSet.addItems(repository.stats.contributorsLast30Days);
          contributorsBefore30Days.addItems(repository.stats.contributorsBefore30Days);
          totalCommits = repository.stats.numberOfCommits;
        })
        this.newContributorsLast30Days = 0;
        Array.from(contributorsLast30DaysSet).forEach((person)=>{
            if(!contributorsBefore30Days.has(person)){
              this.newContributors+=1;
            }
        })
        const allContributors = new Set();
        this.contributors = contributorsLast30DaysSet.size;
        this.allCommits = totalCommits;
      })
      }
    ,
    setupChart: function () {

      var ctx = document.getElementById('commitsPerMonthChart').getContext('2d');
      this.chart = new Chart(ctx, {
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
        options: {
          elements: {
            line: {
              tension: 0.000001
            }
          }
        }
      });

      var ctx2 = document.getElementById('contributorsPerMonthChart').getContext('2d');
      this.chart2 = new Chart(ctx2, {
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
    }
  }
}


//Vue stuff
const routes = [
  { path: '/', component: List },
  { path: '/project/:name', component: Project }
]
const router = new VueRouter({
  routes // short for `routes: routes`
})
const app = new Vue({
  router
}).$mount('#app');
