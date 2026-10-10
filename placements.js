/* placements.js — where the site keeps the adjustments made with place.js.

   Press p on any page, move a drawing about, press c, and paste what you get
   here. Everything below is applied on load, for everyone, on every visit.

   The three numbers are all relative, so they hold at any window size or zoom:

     tx, ty  how far it has moved, in per cent of its own width and height
     s       how big it is, as a multiple of its drawn size
     r       how far it has turned, in degrees

   A page with nothing under it can be left out. Keys are whatever the page
   calls a drawing (data-place), else its id with a #, else the file it draws
   with and which one of those it is — bed.svg[0]. */
window.PLACEMENTS = {

  // 'rathole.html': {
  //   'room:bed': { tx: 0, ty: 0, s: 1, r: 0 }
  // },

};
