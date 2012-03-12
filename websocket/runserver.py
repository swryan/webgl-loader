import sys, os
import subprocess

import struct

from tornado import httpserver, web, websocket, ioloop

from modelpublisher import publish_models

WEB_SERVER_PORT = 8888
WEB_SOCKET_PORT = 8889

class IndexHandler(web.RequestHandler):
    ''' render the page
    '''
    def get(self):
        self.render('index.html')

class FloatHandler(web.RequestHandler):
    ''' render the page
    '''
    def get(self):
        floats = [ 1.1, 3.3, 5.5, 7.7, 11.11, 13.13, 17.17 ]
        s = struct.pack('f'*len(floats),*floats)
        self.set_header('content_type','application/octet-stream')
        self.write(s)

class ServerHandler(web.RequestHandler):
    ''' initialize the web socket server & return the socket address
    '''
    def get(self):
        ws_port = WEB_SOCKET_PORT
        ws_url  = '/socket'
        subprocess.Popen(['python','modelpublisher.py',str(ws_port),ws_url])
        ws_addr = 'ws://localhost:%d%s' % (ws_port, ws_url)
        self.write(ws_addr)

class SamplesFileHandler(web.StaticFileHandler): 
    ''' serve static files from the samples directory
    '''
    def initialize(self): 
        parent_path = os.path.join(os.path.dirname(__file__), os.path.pardir)
        self.root = os.path.abspath(os.path.join(parent_path, 'samples'))

    def get(self, path): 
        web.StaticFileHandler.get(self, path) 
                

def main():
    ''' run the web server
    '''
    print '<<<'+str(os.getpid())+'>>> main'
    settings = { 
        'template_path':     os.path.dirname(os.path.abspath(__file__)),
        'debug':             True,
    }
    application = web.Application([
        web.url(r'/',            IndexHandler),
        web.url(r'/floats/?',    FloatHandler),
        web.url(r'/server/?',    ServerHandler),
        web.url(r'/(.*)',        SamplesFileHandler),
    ], **settings)
    
    print 'running web server on port:',WEB_SERVER_PORT
    print "(that's your cue to point your Chrome browser at http://localhost:%d)" % WEB_SERVER_PORT
    http_server = httpserver.HTTPServer(application)
    http_server.listen(WEB_SERVER_PORT)
    ioloop.IOLoop.instance().start()
        
if __name__ == '__main__':
    # dont run main() if this is a forked windows process
    if sys.modules['__main__'].__file__ == __file__:
        main()
