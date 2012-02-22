import sys, os
import multiprocessing
import json

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

class SamplesFileHandler(web.StaticFileHandler): 
    ''' serve staic files from the samples directory
    '''
    def initialize(self): 
        parent_path = os.path.join(os.path.dirname(__file__), os.path.pardir)
        self.root = os.path.abspath(os.path.join(parent_path, 'samples'))

    def get(self, path): 
        web.StaticFileHandler.get(self, path) 
                
def runServer(ws_url,ws_port):
    ''' run a web server on the specified port to serve a WebSocket
    '''
    print '<<<'+str(os.getpid())+'>>> runServer'

    class WSHandler(websocket.WebSocketHandler):
        ''' this websocket will stream a series of messages at 10 sec intervals
        '''                
        def write_next_message(self):
            try:
                if self.counter > len(models)-1:
                    print 'all done, stopping timer...'
                    self.timer.stop()
                    return
                message = json.loads(models[self.counter])
                print 'sending model:',message.keys()
                #print json.dumps(message,indent=2)                    
                self.write_message(message)
                self.counter += 1
            except Exception, err:
                print 'Failed to send message:',err
                print models[self.counter]
                self.counter += 1
            
        def initialize(self,addr):
            self.counter = 0
            self.timer = ioloop.PeriodicCallback(self.write_next_message, 10000)
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
        'template_path':     app_path,
        'debug':             True,
    }
    application = web.Application([
        web.url(r'/',            IndexHandler),
        web.url(r'/server/?',    ServerHandler),
        web.url(r'/(.*)',        SamplesFileHandler),
    ], **settings)
    
    print 'running web server on port:',WEB_SERVER_PORT
    http_server = httpserver.HTTPServer(application)
    http_server.listen(WEB_SERVER_PORT)
    ioloop.IOLoop.instance().start()
        
if __name__ == '__main__':
    # dont run main() if this is a forked windows process
    if sys.modules['__main__'].__file__ == __file__:
        main()

        
models = [ """
{
    "ben.utf8": [
      { "material": "",
        "attribRange": [0, 8557],
        "indexRange": [68456, 14108]
      },
      { "material": "James_Body_Lores.ppm",
        "attribRange": [110780, 4990],
        "indexRange": [150700, 7830]
      },
      { "material": "James_Eye_Green.ppm",
        "attribRange": [174190, 3834],
        "indexRange": [204862, 7284]
      },
      { "material": "James_Eye_Inner_Green.ppm",
        "attribRange": [226714, 902],
        "indexRange": [233930, 1664]
      },
      { "material": "James_Face_Color_Hair_Lores.ppm",
        "attribRange": [238922, 2219],
        "indexRange": [256674, 4168]
      },
      { "material": "James_Mouth_Gum_Lores.ppm",
        "attribRange": [269178, 1446],
        "indexRange": [280746, 2624]
      },
      { "material": "James_Tongue_Lores.ppm",
        "attribRange": [288618, 845],
        "indexRange": [295378, 1578]
      },
      { "material": "MCasShoe1TEX_Lores.ppm",
        "attribRange": [300112, 8616],
        "indexRange": [369040, 15036]
      },
      { "material": "MJeans1TEX_Lores.ppm",
        "attribRange": [414148, 8200],
        "indexRange": [479748, 15293]
      },
      { "material": "MTshirt3TEX_Lores.ppm",
        "attribRange": [525627, 4283],
        "indexRange": [559891, 7216]
      },
      { "material": "Nail_Hand_01_Lores.ppm",
        "attribRange": [581539, 1023],
        "indexRange": [589723, 1228]
      }
    ]
}
""",
"""
{
    "hand.utf8": [
      { "material": "",
        "attribRange": [0, 688],
        "indexRange": [5504, 1280]
      },
      { "material": "hand.ppm",
        "attribRange": [9344, 9052],
        "indexRange": [81760, 15855]
      }
    ]
}
""",
"""
{
    "walt.utf8": [
      { "material": "",
        "attribRange": [0, 55294],
        "indexRange": [442352, 108806]
      },
      { "material": "",
        "attribRange": [768770, 27187],
        "indexRange": [986266, 52810]
      }
    ]
}
"""
]        
