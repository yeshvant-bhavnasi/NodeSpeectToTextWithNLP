setTimeout(
    function () {
      var dog = 'haha';
      var recognition;
      let socket = io.connect("http://10.190.97.146:3000/");
      //let socket = io.connect("http://98.234.219.228:3000/");
  
      var chat = {
        messageToSend: '',
        
        init: function () {
          this.cacheDOM();
          this.bindEvents();
          this.render();
          $('#suggestion').hide();
          $('.tran').addClass("active");
  
          try {
            var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.onresult = function (event) {
  
              // event is a SpeechRecognitionEvent object.
              // It holds all the lines we have captured so far.
              // We only need the current one.
              var current = event.resultIndex;
              // Get a transcript of what was said.
              var transcript = event.results[current][0].transcript;
              var dt = new Date();
              var utcDate = dt.toUTCString()
              var data = {
                'transcript': event.results[current][0].transcript,
                'confidence': event.results[current][0].confidence,
                'timestamp': utcDate
              }
              console.log(data);
              socket.emit("transcript", data);
            }
           
          }
          catch (e) {
            console.error(e);
            $('.no-browser-support').show();
          }
  
  
          socket.on("render", conversation => {
            console.log(conversation);
            chat.bindTranscript(conversation);
          });
  
  
        },
        bindTranscript: function (val) {
          let userType = val.user == 'agent' ? 'A' : 'I';
  
          let transcription = $('#transcription');
          msg = `<li class="transcription-wrapper">
              <span class="icon">`+ userType + `</span>
              <span class="transcription_msg draggable" >
                  `+ val.taggedTranscript + `
              </span>
            </li>`;
            let suggestion = $('#suggestion');
  
            if(val.annotations.length > 0){
              for(var i=0; i<val.annotations.length; i++){
                suggestionValue = ` <li class="suggestion-wrapper">
                <div class="suggestion-ans">
                  `+val.annotations[i].key+`
                </div>
                <div class="suggestion-txt">
                  &#x21B3; <span>`+val.annotations[i].value+` </span>
                </div>
                <div class="confirm-btn">
                  <img src="https://cdn3.iconfinder.com/data/icons/flat-actions-icons-9/792/Close_Icon_Dark-512.png"
                    alt="circle" class="remove" >
                    <img src=" https://cdn3.iconfinder.com/data/icons/flat-actions-icons-9/792/Tick_Mark_Dark-512.png"
                    alt="check,"  class="add">
                  </div>
              </li>`;
              suggestion.append(suggestionValue)
              }
            }
  
          transcription.append(msg);
          
          chat.dragbind();
        },
        restAll: function(){
          $('#suggestion').empty();
          $('#transcription').empty();
          recognition.stop();
        },
        copyToClipboard: function (element) {
          var $temp = $("<input>");
          $("body").append($temp);
          let val = $(element).text();
          $temp.val(val.trim()).select();
          document.execCommand("copy");
          $temp.remove();
        },
        cacheDOM: function () {
          this.$chatHistory = $('.chat-history');
          this.$button = $('button');
          this.$textarea = $('#message-to-send');
          this.$chatHistoryList = this.$chatHistory.find('ul');
          this.$tab = $('.tab');
          this.$suggestion = $('#suggestion');
          this.$transcription = $('#transcription');
        },
        bindEvents: function () {
          $('.container').on('mouseover',function(){
            chat.dragbind();
          })
          this.$tab.on('click', this.tabbing.bind(this))
          $('.fab-button').click(function () {
            $('.floating-menus').toggle();
            $('.fab-button i').toggleClass('fa-close fa-plus');
          });
  
          $('.play').click(function () {
            $(this).toggleClass('fa-play');
            $(this).toggleClass('fa-pause');
            if ($(this).hasClass('fa-pause')) {
              socket.emit("change_username", { username: 'agent' });
              $("#status").text("(Recording)");
              recognition.start();
              recognition.addEventListener('end', function() { 
                console.log('Speech recognition service disconnected');
                recognition.start();
              });
            } else {
              recognition.stop();
              socket.emit("conversation_end", {});
              $("#status").text("(Start)");
            }
          });
  
          $('#transcription').on('click', '.transcription_msg', function () {
            chat.copyToClipboard(this);
          });
  
          $('#rest').on('click',function(){
            chat.restAll();
          });
  
          $("#suggestion").on('click','.remove',function(){
            $(this).parent().parent().delay(200).fadeOut(1000);
              $(this).parent().parent().animate({
                  "opacity" : "0",
                  "background":"red"
                  },{
                  "complete" : function() {
                    $(this).remove();
                  }
              });
          });
  
          $("#suggestion").on('click','.add',function(){
            let meta = $(this).parent().parent().find('.suggestion-ans').text().trim();
            let value = $(this).parent().parent().find('.suggestion-txt span').text().trim();
  
            if(meta == "policyNumber"){
              $(`label:contains(`+value+`)`).trigger( "click" );
            }else if(meta == "lossType" || meta =="subject"){
              $(`div:contains(`+value.substring(0, 1).toUpperCase() + value.substring(1)+`)`).trigger( "click" );
            }else if(meta == "location"){
              $("label:contains('Address Line 1')").next().find('input').val(value);
            }else if(meta == "location"){
              $("label:contains('Address Line 1')").next().find('input').val(value);
            }
            console.log(meta,value);
            $(this).parent().parent().delay(200).fadeOut(1000);
              $(this).parent().parent().animate({
                  "opacity" : "0",
                  "background":"red"
                  },{
                  "complete" : function() {
                    $(this).remove();
                  }
              });
          });
  
        },
        dragbind: function () {
          $('.transcription_msg span').draggable({
            revert: "invalid",
            stack: "transcription_msg",
            helper: 'clone',
            over: function (event, ui) {
              event.target.addClass('hoverClass');
            },
            start: function (e, ui) {
              $(ui.helper).addClass("ui-draggable-helper");
            }
          });
  
          $('.suggestion-txt span').draggable({
            revert: "invalid",
            stack: "transcription_msg",
            helper: 'clone',
            over: function (event, ui) {
              event.target.addClass('hoverClass');
            },
            start: function (e, ui) {
              $(ui.helper).addClass("ui-draggable-helper");
            }
          });
  
          $("input").droppable({
            drop: function (event, ui) {
              val = ui.draggable.text();
              event.target.value = val.trim();
            }
          });
  
          $("textarea").droppable({
            drop: function (event, ui) {
              val = ui.draggable.text();
              event.target.value = val.trim();
            }
          });
         
        },
        tabbing: function (a) {
          console.log(a.target.innerText);
          if (a.target.innerText == 'Transcription') {
            $('#transcription').show();
            $('#suggestion').hide();
  
            $('.tran').addClass("active");
            $('.sugg').removeClass("active");
          } else {
            $('#suggestion').show();
            $('#transcription').hide();
  
            $('.sugg').addClass("active");
            $('.tran').removeClass("active");
          }
        },
        render: function () {
          this.scrollToBottom();
          if (this.messageToSend.trim() !== '') {
            var template = Handlebars.compile($("#message-template").html());
            var context = {
              messageOutput: this.messageToSend,
              time: this.getCurrentTime()
            };
  
            this.$chatHistoryList.append(template(context));
            this.scrollToBottom();
            this.$textarea.val('');
  
            // responses
  
            var templateResponse = Handlebars.compile($("#message-response-template").html());
            var contextResponse = {
              response: this.dog,
              time: this.getCurrentTime()
            };
  
            setTimeout(function () {
              this.$chatHistoryList.append(templateResponse(contextResponse));
              this.scrollToBottom();
            }.bind(this), 1500);
  
          }
  
        },
        scrollToBottom: function () {
          //this.$chatHistory.scrollTop(this.$chatHistory[0].scrollHeight);
        },
        getCurrentTime: function () {
          return new Date().toLocaleTimeString().
            replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        }
  
      };
  
      chat.init();
  
      // was here
  
    }, 500);