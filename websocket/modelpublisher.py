import sys, os
import json

from tornado import httpserver, web, websocket, ioloop
                
def publish_models(ws_port,ws_url):
    ''' run a web server on the specified url and port to serve a WebSocket
    '''
    print '<<<'+str(os.getpid())+'>>> publish_models'

    class WSHandler(websocket.WebSocketHandler):
        ''' this websocket will stream a series of messages at 10 sec intervals
        '''                
        def send_next_model(self):
            try:
                if self.counter > len(models)-1:
                    print 'all done, stopping timer...'
                    self.timer.stop()
                    self.close()
                    return
                message = json.loads(models[self.counter])
                print 'sending model info:',message.keys()
                #print json.dumps(message,indent=2)                    
                self.write_message(message)
                self.counter += 1
            except Exception, err:
                print 'failed to send model info:',err
                print models[self.counter]
                self.counter += 1
            
        def initialize(self,addr):
            self.counter = 0
            
        def open(self):
            # start sending models when the port is opened
            self.send_next_model()
            self.timer = ioloop.PeriodicCallback(self.send_next_model, 10000)
            self.timer.start()
        
        
    application = web.Application([
        (ws_url, WSHandler, dict(addr=ws_url))
    ])
    
    print 'serving web socket on port:',ws_port
    http_server = httpserver.HTTPServer(application)
    http_server.listen(ws_port)
    ioloop.IOLoop.instance().start()


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

def main(argv=None):
    if argv is None:
        argv = sys.argv
    
    try:
        ws_port = argv[1]
        ws_url = argv[2]
        publish_models(ws_port,ws_url)
    except Exception,err:
        "Couldn't run model publisher, check your args:",err

if __name__ == '__main__':
    main()