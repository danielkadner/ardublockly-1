'use strict';

/** Create a namespace for the application. */
var SenseboxExtension = SenseboxExtension || {};

SenseboxExtension.SUPPORTED_BOARDS = {
  'sensebox': 'Arduino/Genuino UNO',
  'sensebox-mcu': 'senseBox MCU'
};

/** Initialize function for senseBox extensions, to be called on page load. */
SenseboxExtension.init = function() {
  var location = window.location;
  var urlParams = new URLSearchParams(location.search);
  Ardublockly.loadServerXmlFile('../ardublockly/start.xml');

  if (urlParams.has('board')) {
    window.BOARD = urlParams.get('board');
  } else {
    window.BOARD = 'sensebox';
  }

  if (location.hostname !== 'localhost') {
    //TODO hide all features of running ardublockly locally
    var buttons_offline = document.getElementById('buttons_offline');
    var buttons_online = document.getElementById('buttons_online');
    buttons_offline.classList.add('hidden');
    buttons_online.classList.remove('hidden');

    //Hide offline settings
    var settings_online = document.getElementsByClassName('modal_section online');
    for (let index = 0; index < settings_online.length; index++) {
      const element = settings_online[index];
      element.classList.add('hidden');
    }
    var settings_offline = document.getElementsByClassName('modal_section offline')[0];
    settings_offline.classList.remove('hidden');
    SenseboxExtension.populateBoards();
  }

  //TODO hide old and new blocks depending on selected senseBox version
  switch (window.BOARD) {
    case 'sensebox':
      // ArdublocklyServer.setArduinoBoard('Uno', function(jsonObj) {
      //   var newEl = ArdublocklyServer.jsonToHtmlDropdown(jsonObj);
      //   Ardublockly.setArduinoBoardsHtml(newEl);
      // });
      window.EXTENSION = 'hex';
      break;
    case 'sensebox-mcu':
      window.EXTENSION = 'bin';
      break;
  }
  var clipboard = new ClipboardJS('.copy-btn');
  clipboard.on('success', function(e) {
    console.log(e);
    Ardublockly.MaterialToast(Ardublockly.getLocalStr('code_copied'));
  });
  clipboard.on('error', function(e) {
    console.log(e);
  });

  document.getElementById("button_copy_clipboard").setAttribute("data-tooltip", Ardublockly.getLocalStr('save_to_clipboard'));
  document.getElementById("button_compile_sketch").setAttribute("data-tooltip", Ardublockly.getLocalStr('compile_sketch'));

  var compile = document.getElementById('button_compile_sketch');
  compile.addEventListener('click', function () {
    var sketch = Ardublockly.generateArduino();
    var data = {
      "board": window.BOARD,
      "sketch": sketch
    };
    var request = ArdublocklyServer.createRequest();
    // The data received is JSON, so it needs to be converted into the right
    // format to be displayed in the page.
    var onReady = function() {
      if (request.readyState == 4) {
        if (request.status == 200) {
          var response = null;
          try {
            response = JSON.parse(request.response);
            window.open('https://compiler.sensebox.de/download?id='+response.data.id+'&board='+window.BOARD, '_self');
            Ardublockly.MaterialToast(Ardublockly.getLocalStr('sketch_compiled'));
          } catch(e) {
            throw e;
          }
        } else if (request.status == 500) {
          response = JSON.parse(request.response);
          var data = {
            ide_data: {
              std_output: '',
              err_output: response.message
            },
            errors: [{id: 1}]
          }
          var dataBack = ArdublocklyServer.jsonToIdeModal(data);
          Ardublockly.arduinoIdeOutput(dataBack);
          var outputHeader = document.getElementById('ide_output_collapsible_header');
          if (!outputHeader.className.match('active')) {
            outputHeader.click();
          }
        } else {
          Ardublockly.MaterialToast(Ardublockly.getLocalStr('arduinoOpErrorTitle'));
          return null;
        }
      }
    };
    try {
      Ardublockly.resetIdeOutputContent();
      request.open('POST', 'https://compiler.sensebox.de/compile', true);
      request.setRequestHeader('Content-Type', 'application/json');
      request.onreadystatechange = onReady;
      request.send(JSON.stringify(data));
    } catch (e) {
      console.log('Error: ', e);
      throw e;
    }
  });
};

SenseboxExtension.changeBoard = function (event) {
  window.BOARD = event.target.value;
}

SenseboxExtension.populateBoards = function () {
  $('#boards-online').material_select('destroy');
  var boardsMenu = document.getElementById('boards-online');
  boardsMenu.options.length = 0;

  for (var board in SenseboxExtension.SUPPORTED_BOARDS) {
    var option = new Option(SenseboxExtension.SUPPORTED_BOARDS[board], board);
    if (board == window.BOARD) {
      option.selected = true;
    }
    boardsMenu.options.add(option);
  }
  boardsMenu.onchange = SenseboxExtension.changeBoard;
  $('#boards-online').material_select();
}