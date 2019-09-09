$('body').append(`
<div id="floating-container">
    <div class="floating-menus" style="display:none;">

      <div class="container clearfix">

        <div class="chat">
          <div class="chat-header clearfix">
            <i class="fa fa-play play"></i>
            <div class="chat-about">
              <div class="chat-with" id="rest">Assistant <span id="status"> </span></div>
            </div>
          </div> <!-- end chat-header -->

          <div class="tab-wrapper">
            <div class="tab  tran">Transcription</div>
            <div class="tab  sugg">Suggestions </div>
          </div> <!-- end chat-header -->


          <div class="chat-history clearfix">
            <ul id="transcription">

            </ul>

            <ul id="suggestion">

            </ul>
          </div> <!-- end chat-history -->


        </div> <!-- end chat -->

      </div> <!-- end container -->

    </div>
    <div class="fab-button">
    <span class="gw-image-versioning-logo-mobile"></span>
    </div>
  </div>`);

console.log("chrome extension script loaded");
