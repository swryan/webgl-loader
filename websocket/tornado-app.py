import sys, os
import multiprocessing

from tornado import httpserver, web, websocket, ioloop

WEB_SERVER_PORT = 8888
WEB_SOCKET_PORT = 8889

class IndexHandler(web.RequestHandler):
    ''' render the workspace
    '''
    def get(self):
        self.render('test.html')

class ServerHandler(web.RequestHandler):
    ''' initialize the web socket server & return the socket
    '''
    def get(self):
        ws_url  = '/socket'
        ws_port = WEB_SOCKET_PORT
        srvr = multiprocessing.Process(target=runServer, args=(ws_url,ws_port))
        srvr.start()
        ws_addr = 'ws://localhost:%d%s' % (ws_port, ws_url)
        self.write(ws_addr)


def runServer(ws_url,ws_port):
    ''' run a web server on the specified port to serve a WebSocket
    '''
    print '<<<'+str(os.getpid())+'>>> runServer'

    class WSHandler(websocket.WebSocketHandler):
        ''' this websocket will stream a series of messages at 2 sec intervals
        '''                
        def write_next_message(self):
            if self.counter > 10:
                message = '<p>thats the last you will hear from me!</p>'
                self.timer.stop()
            else:
                message = '<p>message #%d</p>' % self.counter
                self.counter += 1
                
            if not isinstance(message, unicode):
                enc = sys.getdefaultencoding()
                message = message.decode(enc, 'replace')
                
            self.write_message(message)
            
        def initialize(self,addr):
            self.counter = 0
            self.timer = ioloop.PeriodicCallback(self.write_next_message, 2000)
            self.timer.start()
        
    application = web.Application([
        (ws_url, WSHandler, dict(addr=ws_url))
    ])
    
    print 'serving web socket on port:',ws_port
    http_server = httpserver.HTTPServer(application)
    http_server.listen(ws_port)
    ioloop.IOLoop.instance().start()


def main():
    ''' run the main web server on port 8000
    '''
    print '<<<'+str(os.getpid())+'>>> main'
    app_path = os.path.dirname(os.path.abspath(__file__))
    par_path = os.path.join(app_path, os.path.pardir)
    static_path = os.path.join(par_path, 'samples')
    settings = { 
        'static_path':       static_path,
        'template_path':     app_path,
        'debug':             True,
    }
    application = web.Application([
        web.url(r'/',            IndexHandler),
        web.url(r'/server/?',    ServerHandler),
    ], **settings)
    
    print 'running web server on port:',WEB_SERVER_PORT
    http_server = httpserver.HTTPServer(application)
    http_server.listen(WEB_SERVER_PORT)
    ioloop.IOLoop.instance().start()
        
if __name__ == '__main__':
    # dont run main() if this is a forked windows process
    if sys.modules['__main__'].__file__ == __file__:
        main()
