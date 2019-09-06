type server struct {
	router int
}
func main(){
	if err:=run(); err != nill{
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}

func run() error {

}

func newServer() *server {
	s:= &server{}
	s.routes()
	return s
}

func (s *server) ServeHTTP( w http.ResponseWriter, r *http.Request){
	s.router.serveHTTP(w,r)
}

func (s *server) routes() {
	s.router.Get("/", s.handleIndex())
	s.router.Get("/admin", s.adminOnly(s.handleAdminIndex()))
}

func (s *server) handleIndex() http.HandlerFunc{
	//Prepare thing with closure
	return func(w http.ResponseWriter, r *http.Request){
		//code
	}
}
func (s *server) adminOnly(h http.HandlerFunc) http.HandlerFunc{
	//Prepare thing with closure
	return func(w http.ResponseWriter, r *http.Request){
		if !currentUser(r).isAdmin {
			http.NotFound(w,r)
			return
		}
		h(w,r)
	}
}
