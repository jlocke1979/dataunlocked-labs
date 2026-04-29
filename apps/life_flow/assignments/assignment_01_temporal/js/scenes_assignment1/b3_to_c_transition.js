export function runB3ToCTransition(data) {
  d3.select("#viz").html(`
    <div style="
      min-height: 700px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      font-family: sans-serif;
      color: #222;
      padding: 40px 60px;
      box-sizing: border-box;
      text-align: center;
    ">
      <div style="
        position: absolute;
        bottom: -78px;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        gap: 8px;
      ">
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ccc;"></div>
        <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #333;"></div>
      </div>

      <div style="max-width: 760px;">
        <h1 style="
          margin: 0 0 18px 0;
          font-size: 30px;
          font-weight: 700;
          line-height: 1.2;
          color: #222;
        ">
         Rare organ transplant combinations exist with limited reporting 




        <p style="
          margin: 24 px;
          font-size: 18px;
          line-height: 1.6;
          color: #555;
          text-align: center;
        ">
           Liver + Lung ; Liver + Intestine         </p>


        <p style="
            position: absolute;
            bottom: 50px;
            left: 0;
            width: 100%;
            font-size: 12px;
            color: #888;
            text-align: center;
          ">
            Source: United Network of Organ Sharing (UNOS) - https://unos.org/
        </p>

        <p style="
            position: absolute;
            bottom: 50px;
            left: 0;
            width: 100%;
            font-size: 12px;
            color: #888;
            text-align: center;
          ">

        </p>

          </div>
    
          </div>
  `);
}
