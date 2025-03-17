class WEBVideoViewer {
  constructor() {
    console.log('WEBVideoViewer initialized');
    this._canvas = document.getElementsByClassName('stage_stage_1fD7k box_box_2jjDp')[0].getElementsByTagName('canvas')[0];
    this._canvas.position = 'absolute';
    this._canvas.left = '0px';
    this._canvas.top = '0px';
    this._background = document.getElementsByClassName('stage_stage_1fD7k box_box_2jjDp')[0];

    this._web_video_canvas = document.createElement('canvas');
    this._web_video_canvas.id = 'web_video_canvas';
    this._web_video_canvas.position = 'absolute';
    this._web_video_canvas.left = '0px';
    this._web_video_canvas.top = '0px';
    this._web_video_context = this._web_video_canvas.getContext('2d');

    this._image = document.createElement('img');
    this._image.src = 'http://localhost:8080/stream?topic=/image_raw';
    this._image.id = 'web_video';
    this._image.crossOrigin = 'Anonymous';

    this._web_video_canvas.width = parseInt(this._background.style.width, 10);
    this._web_video_canvas.height = parseInt(this._background.style.height, 10);

    var parent = this._canvas.parentNode;
    parent.replaceChild(this._web_video_canvas, this._canvas);

    this._draw_canvas_id = null;
    console.log("construction completed");
  }

  drawCanvas() {
    try {
      this.updateDisplaySize();
      this._web_video_context.drawImage(this._image,
        0, 0, this._image.width, this._image.height,
        0, 0, this._web_video_canvas.width, this._web_video_canvas.height);
    } catch (e) {
      console.log(e);
    }
    this._draw_canvas_id = window.requestAnimationFrame(() => this.drawCanvas());
  }

  async canDrawCanvas(url) {
    try {
      let response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      console.log('Canvas drawing is possible');
      return response.ok || response.type === 'opaque';
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async selectImageURL(ip, topic_name) {
    let url = 'http://' + ip + ':8080/stream?topic=' + topic_name;
    console.log(url);
    if (await this.canDrawCanvas(url)) {
      this._image.src = url;
      window.cancelAnimationFrame(this._draw_canvas_id);
      this.drawCanvas();
    }
  }

  stopDrawingCanvas() {
    window.cancelAnimationFrame(this._draw_canvas_id);
  }

  updateDisplaySize() {
    this._web_video_canvas.width = parseInt(this._background.style.width, 10);
    this._web_video_canvas.height = parseInt(this._background.style.height, 10);
  }

  restartDrawCanvas() {
    window.cancelAnimationFrame(this._draw_canvas_id);
    this.drawCanvas();
  }
}

module.exports = WEBVideoViewer;
