var Session, fs, message, mkdirp, net, os, path, randomstring;
net = require('net');
fs = require('fs');
os = require('os');
path = require('path');
mkdirp = require('mkdirp');
randomstring = require('./randomstring');
status - (message = require('./status'));

Session = (function() {
  Session.prototype.should_parse_data = false;
  Session.prototype.readbytes = 0;
  Session.prototype.settings = {};
  function Session(socket) {
    this.socket = socket;
    this.online = true;
    socket.on("data", (function(_this) {
      return function(chunk) {
        return _this.parse_chunk(chunk);
      };
    })(this));
    socket.on("close", (function(_this) {
      return function() {
        return _this.online = false;
      };
    })(this));
  }

  Session.prototype.make_tempfile = function() {
    var dirname;
    this.tempfile = path.join(os.tmpdir(), randomstring(10), this.basename);
    console.log("[ratom] create " + this.tempfile);
    dirname = path.dirname(this.tempfile);
    mkdirp.sync(dirname);
    return this.fd = fs.openSync(this.tempfile, 'w');
  };

  Session.prototype.parse_chunk = function(chunk) {
    var i, line, lines, match, _i, _len, _results;
    if (chunk) {
      chunk = chunk.toString("utf8");
      match = /\n$/.test(chunk);
      chunk = chunk.replace(/\n$/, "");
      lines = chunk.split("\n");
      _results = [];
      for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
        line = lines[i];
        if (i < lines.length - 1 || match) {
          line = line + "\n";
        }
        _results.push(this.parse_line(line));
      }
      return _results;
    }
  };

  Session.prototype.parse_line = function(line) {
    var m;
    if (this.should_parse_data) {
      if (this.readbytes >= this.datasize && line === ".\n") {
        this.should_parse_data = false;
        fs.closeSync(this.fd);
        return this.open_in_atom();
      } else if (this.readbytes < this.datasize) {
        this.readbytes += Buffer.byteLength(line);
        return fs.writeSync(this.fd, line);
      }
    } else {
      m = line.match(/([a-z\-]+?)\s*:\s*(.*?)\s*$/);
      if (m && (m[2] != null)) {
        this.settings[m[1]] = m[2];
        switch (m[1]) {
          case "token":
            return this.token = m[2];
          case "data":
            this.datasize = parseInt(m[2], 10);
            return this.should_parse_data = true;
          case "display-name":
            this.displayname = m[2];
            this.remoteAddress = this.displayname.split(":")[0];
            this.basename = path.basename(this.displayname.split(":")[1]);
            return this.make_tempfile();
        }
      }
    }
  };

  Session.prototype.open_in_atom = function() {
    console.log("[ratom] opening " + this.tempfile);
    return atom.workspace.open(this.tempfile).then((function(_this) {
      return function(editor) {
        return _this.handle_connection(editor);
      };
    })(this));
  };

  Session.prototype.handle_connection = function(editor) {
    var buffer;
    buffer = editor.getBuffer();
    buffer.on('saved', (function(_this) {
      return function() {
        return _this.save();
      };
    })(this));
    return buffer.on('destroyed', (function(_this) {
      return function() {
        if (_this.socket != null) {
          return _this.close();
        }
      };
    })(this));
  };

  Session.prototype.send = function(cmd) {
    if (this.online) {
      return this.socket.write(cmd + "\n");
    }
  };

  Session.prototype.save = function() {
    var data;
    if (!this.online) {
      status - message.display("Error saving " + (path.basename(this.tempfile)) + " to " + this.remoteAddress, 2000);
      return;
    }
    status - message.display("Saving " + (path.basename(this.tempfile)) + " to " + this.remoteAddress, 2000);
    this.send("save");
    this.send("token: " + this.token);
    data = fs.readFileSync(this.tempfile);
    this.send("data: " + Buffer.byteLength(data));
    this.socket.write(data);
    return this.send("");
  };

  Session.prototype.close = function() {
    if (this.online) {
      this.online = false;
      this.send("close");
      this.send("");
      return this.socket.end();
    }
  };

  return Session;

})();

module.exports = {
  configDefaults: {
    port: 52698,
    launch_at_startup: false,
    keep_alive: false
  },
  online: false,
  activate: function(state) {
    if (atom.config.get("ratom.launch_at_startup")) {
      this.startserver();
    }
    atom.commands.add('atom-workspace', "ratom:start", (function(_this) {
      return function() {
        return _this.startserver();
      };
    })(this));
    return atom.commands.add('atom-workspace', "ratom:stop", (function(_this) {
      return function() {
        return _this.stopserver();
      };
    })(this));
  },
  deactivate: function() {
    return this.stopserver();
  },
  start: function(quiet) {
    var port;
    if (quiet == null) {
      quiet = false;
    }
    if (this.online) {
      this.stopserver();
      status - message.display("Restarting ratom server", 2000);
    } else {
      if (!quiet) {
        status - message.display("Starting ratom server", 2000);
      }
    }
    this.server = net.createServer(function(socket) {
      var session;
      session = new Session(socket);
      return session.send("Atom " + atom.getVersion());
    });
    port = atom.config.get("ratom.port");
    this.server.on('listening', (function(_this) {
      return function(e) {
        _this.online = true;
        return console.log("[ratom] listening on port " + port);
      };
    })(this));
    this.server.on('error', (function(_this) {
      return function(e) {
        if (!quiet) {
          status - message.display("Unable to start server", 2000);
        }
        if (atom.config.get("ratom.keep_alive")) {
          return setTimeout((function() {
            return _this.startserver(true);
          }), 10000);
        }
      };
    })(this));
    this.server.on("close", function() {
      return console.log("[ratom] stop server");
    });
    return this.server.listen(port, 'localhost');
  },
  stop: function() {
    status - message.display("Stopping remote atom server", 2000);
    if (this.online) {
      this.server.close();
      return this.online = false;
    }
  }
};
