const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const inr=n=>"₹"+Number(n).toLocaleString("en-IN");
const seed=()=>({nid:100,
 users:[{id:1,name:"Admin",email:"admin@shop.com",pw:"admin123",role:"admin",blocked:false},{id:2,name:"Demo Customer",email:"demo@shop.com",pw:"demo123",role:"customer",blocked:false}],
 products:[[1,"Wireless Earbuds","Electronics",1499,25,"🎧"],[2,"Smart Watch","Electronics",2999,12,"⌚"],[3,"Cotton T-Shirt","Fashion",499,60,"👕"],[4,"Running Shoes","Fashion",2199,18,"👟"],[5,"Steel Water Bottle","Home",399,40,"🧴"],[6,"Desk Lamp","Home",899,15,"💡"],[7,"Notebook Set","Stationery",249,100,"📓"],[8,"Backpack","Fashion",1299,20,"🎒"]].map(p=>({id:p[0],name:p[1],cat:p[2],price:p[3],stock:p[4],emoji:p[5]})),
 orders:[]});
let db,me=null,view="shop",cart=[],q="",cat="All",busy=false;
try{db=JSON.parse(localStorage.getItem("shoplite"))}catch(e){}
if(!db||!db.users)db=seed();
const save=()=>{try{localStorage.setItem("shoplite",JSON.stringify(db))}catch(e){}};
const prod=id=>db.products.find(p=>p.id==id);
function flash(t,err){$("#msg").innerHTML='<div class="'+(err?"err":"")+'">'+esc(t)+"</div>";clearTimeout(flash.t);flash.t=setTimeout(()=>$("#msg").innerHTML="",3800)}
function go(v){view=v;render()}

/* ---------- User: register, login, logout ---------- */
function login(){const u=db.users.find(x=>x.email==$("#em").value.trim().toLowerCase()&&x.pw==$("#pw").value);
 if(!u)return flash("Email or password is wrong. Try again.",1);
 if(u.blocked)return flash("This account is blocked. Contact the admin.",1);
 me=u;flash("Welcome back, "+u.name+".");go(u.role=="admin"?"aprod":(cart.length?"cart":"shop"))}
function register(){const n=$("#rn").value.trim(),e=$("#re").value.trim().toLowerCase(),p=$("#rp").value;
 if(!n||!e.includes("@")||p.length<4)return flash("Enter a name, a valid email and a password of 4+ characters.",1);
 if(db.users.some(x=>x.email==e))return flash("That email is already registered. Log in instead.",1);
 const u={id:db.nid++,name:n,email:e,pw:p,role:"customer",blocked:false};db.users.push(u);save();me=u;flash("Account created. You are logged in.");go("shop")}
function logout(){me=null;cart=[];flash("You are logged out.");go("shop")}

/* ---------- Cart ---------- */
function add(id){const p=prod(id),c=cart.find(x=>x.id==id),n=c?c.qty:0;
 if(n>=p.stock)return flash("Only "+p.stock+" of "+p.name+" in stock.",1);
 c?c.qty++:cart.push({id:id,qty:1});flash(p.name+" added to cart.");nav()}
function qty(id,d){const c=cart.find(x=>x.id==id),p=prod(id);c.qty+=d;
 if(c.qty>p.stock){c.qty=p.stock;flash("Only "+p.stock+" in stock.",1)}
 if(c.qty<1)cart=cart.filter(x=>x.id!=id);render()}
const total=()=>cart.reduce((s,c)=>s+prod(c.id).price*c.qty,0);
function checkout(){if(!me){flash("Log in to check out.",1);return go("login")}
 if(me.role=="admin"){flash("Admins cannot place orders. Use a customer account.",1);return}go("checkout")}

/* ---------- Order + Payment ---------- */
function pay(){if(busy)return;const a=$("#ad").value.trim(),m=$("#pm").value,d=$("#pd").value.trim();
 if(a.length<8)return flash("Enter a full shipping address.",1);
 if(!d)return flash("Enter your "+(m=="UPI"?"UPI ID":"card number")+".",1);
 for(const c of cart)if(c.qty>prod(c.id).stock){flash("Stock changed for "+prod(c.id).name+". Update your cart.",1);return go("cart")}
 busy=true;$("#paybtn").textContent="Processing payment…";$("#paybtn").disabled=true;
 setTimeout(()=>{busy=false;
  if(d.endsWith("0000")){flash("Payment declined by the gateway. Your order was not placed. Try another payment method.",1);$("#paybtn").textContent="Pay now";$("#paybtn").disabled=false;return}
  const items=cart.map(c=>({id:c.id,name:prod(c.id).name,qty:c.qty,price:prod(c.id).price}));
  const o={id:db.nid++,userId:me.id,date:new Date().toLocaleString("en-IN"),items:items,total:total(),address:a,status:"Confirmed",payment:{id:"PAY"+db.nid,method:m,amount:total(),status:"Success"}};
  cart.forEach(c=>prod(c.id).stock-=c.qty);db.orders.unshift(o);save();cart=[];
  flash("Payment successful. Order #"+o.id+" is confirmed.");go("orders")},900)}
function cancel(id){const o=db.orders.find(x=>x.id==id);if(o.status!="Confirmed")return;
 o.status="Cancelled";o.items.forEach(i=>{const p=prod(i.id);if(p)p.stock+=i.qty});save();flash("Order #"+id+" cancelled. Stock restored.");render()}

/* ---------- Admin ---------- */
function addProd(){const n=$("#pn").value.trim(),c=$("#pc").value.trim()||"General",pr=+$("#pp").value,s=+$("#ps").value;
 if(!n||pr<=0||s<0)return flash("Enter a name, a price above 0 and a stock of 0 or more.",1);
 db.products.push({id:db.nid++,name:n,cat:c,price:pr,stock:s,emoji:"📦"});save();flash(n+" added.");render()}
function upd(id,f,v){const p=prod(id);v=+v;if(isNaN(v)||v<0)return flash("Enter a number of 0 or more.",1);p[f]=v;save();flash("Product updated.")}
function delProd(id){const p=prod(id);db.products=db.products.filter(x=>x.id!=id);cart=cart.filter(c=>c.id!=id);save();flash(p.name+" removed.");render()}
function setStatus(id,s){const o=db.orders.find(x=>x.id==id);if(s=="Cancelled"&&o.status!="Cancelled")o.items.forEach(i=>{const p=prod(i.id);if(p)p.stock+=i.qty});o.status=s;save();flash("Order #"+id+" is now "+s+".");render()}
function block(id){const u=db.users.find(x=>x.id==id);u.blocked=!u.blocked;save();flash(u.name+(u.blocked?" blocked.":" unblocked."));render()}

/* ---------- Views ---------- */
function nav(){const l=(v,t)=>'<button class="'+(view==v?"on":"")+'" onclick="go(\''+v+'\')">'+t+"</button>";
 let h='<span class="brand">ShopLite</span>';
 if(me&&me.role=="admin")h+=l("aprod","Products")+l("aord","Orders")+l("ausr","Users");
 else h+=l("shop","Shop")+l("cart","Cart ("+cart.reduce((s,c)=>s+c.qty,0)+")")+(me?l("orders","My orders"):"");
 h+=me?'<button onclick="logout()">Log out ('+esc(me.name.split(" ")[0])+")</button>":l("login","Log in");
 $("#nav").innerHTML=h}
function grid(){const L=db.products.filter(p=>(cat=="All"||p.cat==cat)&&p.name.toLowerCase().includes(q.toLowerCase()));
 if(!L.length)return '<p class="mu">No products match your search. Clear the search or pick another category.</p>';
 return L.map(p=>'<div class="card"><div class="em">'+p.emoji+"</div><b>"+esc(p.name)+'</b><div class="mu">'+esc(p.cat)+" · "+(p.stock?p.stock+" in stock":"Out of stock")+'</div><div class="row"><span class="price">'+inr(p.price)+'</span><button class="btn" '+(p.stock?"":"disabled")+' onclick="add('+p.id+')">Add to cart</button></div></div>').join("")}
function setQ(v){q=v;$("#grid").innerHTML=grid()}
function setCat(v){cat=v;$("#grid").innerHTML=grid()}
const V={
 shop(){const cs=["All",...new Set(db.products.map(p=>p.cat))];
  return '<h2>Browse products</h2><div class="bar"><input placeholder="Search products" value="'+esc(q)+'" oninput="setQ(this.value)"><select onchange="setCat(this.value)">'+cs.map(c=>"<option"+(c==cat?" selected":"")+">"+esc(c)+"</option>").join("")+'</select></div><div class="grid" id="grid">'+grid()+"</div>"},
 login(){return '<h2>Log in or register</h2><div style="display:flex;gap:40px;flex-wrap:wrap"><div class="form"><b>I have an account</b><label>Email<input id="em" type="email" autocomplete="username"></label><label>Password<input id="pw" type="password" autocomplete="current-password"></label><button class="btn" onclick="login()">Log in</button></div><div class="form"><b>I am new here</b><label>Name<input id="rn"></label><label>Email<input id="re" type="email"></label><label>Password<input id="rp" type="password"></label><button class="btn ghost" onclick="register()">Create account</button></div></div>'},
 cart(){if(!cart.length)return '<h2>Your cart</h2><p class="mu">Your cart is empty. Browse the shop and add something you like.</p><button class="btn" onclick="go(\'shop\')">Browse products</button>';
  return '<h2>Your cart</h2><div class="wrap"><table><tr><th>Product</th><th>Price</th><th>Quantity</th><th>Subtotal</th></tr>'+cart.map(c=>{const p=prod(c.id);return"<tr><td>"+p.emoji+" "+esc(p.name)+"</td><td>"+inr(p.price)+'</td><td><button class="btn ghost" onclick="qty('+c.id+',-1)">−</button> '+c.qty+' <button class="btn ghost" onclick="qty('+c.id+',1)">+</button></td><td>'+inr(p.price*c.qty)+"</td></tr>"}).join("")+'</table></div><div class="tot">Total '+inr(total())+'</div><div style="text-align:right"><button class="btn" onclick="checkout()">Check out</button></div>'},
 checkout(){return '<h2>Checkout</h2><div class="form"><label>Shipping address<textarea id="ad" rows="3">'+"</textarea></label><label>Payment method<select id=\"pm\" onchange=\"$('#pl').textContent=this.value=='UPI'?'UPI ID':'Card number'\"><option>Card</option><option>UPI</option></select></label><label><span id=\"pl\">Card number</span><input id=\"pd\" placeholder=\"Card number or UPI ID\"></label><div class=\"tot\" style=\"text-align:left\">Pay "+inr(total())+'</div><button class="btn" id="paybtn" onclick="pay()">Pay now</button></div>'},
 orders(){const L=db.orders.filter(o=>o.userId==me.id);if(!L.length)return '<h2>My orders</h2><p class="mu">You have not placed any orders yet.</p>';
  return"<h2>My orders</h2>"+L.map(o=>'<div class="card" style="margin-bottom:12px"><div class="row" style="margin:0"><b>Order #'+o.id+'</b><span class="tag">'+o.status+'</span></div><div class="mu">'+o.date+" · Paid by "+o.payment.method+" ("+o.payment.status+")</div><p>"+o.items.map(i=>esc(i.name)+" × "+i.qty).join(", ")+'</p><div class="mu">Ship to: '+esc(o.address)+'</div><div class="row"><span class="price">'+inr(o.total)+"</span>"+(o.status=="Confirmed"?'<button class="btn bad" onclick="cancel('+o.id+')">Cancel order</button>':"")+"</div></div>").join("")},
 aprod(){return '<h2>Manage products</h2><div class="bar"><input id="pn" placeholder="Name"><input id="pc" placeholder="Category"><input id="pp" type="number" placeholder="Price" style="max-width:110px;flex:0 1 110px"><input id="ps" type="number" placeholder="Stock" style="max-width:110px;flex:0 1 110px"><button class="btn" onclick="addProd()">Add product</button></div><div class="wrap"><table><tr><th>Product</th><th>Price (₹)</th><th>Stock</th><th></th></tr>'+db.products.map(p=>"<tr><td>"+p.emoji+" "+esc(p.name)+'<div class="mu">'+esc(p.cat)+'</div></td><td><input type="number" value="'+p.price+'" onchange="upd('+p.id+',\'price\',this.value)"></td><td><input type="number" value="'+p.stock+'" onchange="upd('+p.id+',\'stock\',this.value)"></td><td><button class="btn bad" onclick="delProd('+p.id+')">Remove</button></td></tr>').join("")+"</table></div>"},
 aord(){if(!db.orders.length)return '<h2>Manage orders</h2><p class="mu">No orders have been placed yet.</p>';
  const S=["Confirmed","Packed","Shipped","Delivered","Cancelled"];
  return '<h2>Manage orders</h2><div class="wrap"><table><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th></tr>'+db.orders.map(o=>{const u=db.users.find(x=>x.id==o.userId);return"<tr><td>#"+o.id+'<div class="mu">'+o.date+"</div></td><td>"+esc(u?u.name:"Deleted user")+"</td><td>"+o.items.map(i=>esc(i.name)+" × "+i.qty).join(", ")+"</td><td>"+inr(o.total)+'</td><td><select onchange="setStatus('+o.id+',this.value)">'+S.map(s=>"<option"+(s==o.status?" selected":"")+">"+s+"</option>").join("")+"</select></td></tr>"}).join("")+"</table></div>"},
 ausr(){return '<h2>Manage users</h2><div class="wrap"><table><tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>'+db.users.map(u=>"<tr><td>"+esc(u.name)+"</td><td>"+esc(u.email)+'</td><td><span class="tag">'+u.role+"</span></td><td>"+(u.role=="admin"?"":'<button class="btn '+(u.blocked?"ghost":"bad")+'" onclick="block('+u.id+')">'+(u.blocked?"Unblock":"Block")+"</button>")+"</td></tr>").join("")+"</table></div>"}
};
function render(){if(!me&&["orders","aprod","aord","ausr"].includes(view))view="login";
 if(me&&me.role=="admin"&&["shop","cart","checkout","orders"].includes(view))view="aprod";
 if(me&&me.role!="admin"&&["aprod","aord","ausr"].includes(view))view="shop";
 $("#app").innerHTML=V[view]();nav();
}
render();
