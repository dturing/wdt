
app.nw:
	cd root; zip -r ../$@ *

clean:
	rm app.nw
	
run: clean app.nw
	/opt/node-webkit-v0.7.2-linux-ia32/nw app.nw
	
