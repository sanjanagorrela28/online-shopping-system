# Online Shopping System - UML Mini Project (SANJANA, 5241412020)

## Folders
- ShopLite/   : the working project (index.html, style.css, app.js) + test script
- Documents/  : project report (PDF) and presentation (PPTX)
- Diagrams/   : the six UML diagrams (use case, class, sequence, activity, component, deployment)

## Run in VS Code
1. Unzip, then in VS Code: File > Open Folder > Online_Shopping_System_Project/ShopLite
2. Install the "Live Server" extension (VS Code suggests it automatically).
3. Right-click index.html > "Open with Live Server".
   (No installation is needed; you can also just double-click index.html.)

## Demo accounts
- Admin:    admin@shop.com / admin123
- Customer: demo@shop.com  / demo123
- To see a declined payment, enter a card number ending in 0000.

## Run the automated tests (optional, needs Node.js)
Open a terminal in the ShopLite folder and run:   node test_shoplite.js
(or: npm test)   Expected result: PASSED 31 of 31

## Reset the demo data
Browser DevTools > Application > Local Storage > delete the key "shoplite".
