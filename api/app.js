/*
TO DO: hacer funcion para que al aceptar una reserva cambie el estado de esa hora de reserva a reservado (FRONT)

-Funcionalidad-
menus: creacion de nuevos , visionado
pedidos: creacion de nuevos, visionado, modificacion de estado (pendiente)
reservas: creacion de nuevos, visionado, modificacion de estado (pendiente)
horasDeReserva: visionado (los que esten disponibles), modificacion de estado (pendiente)
*/
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());

const mongoURI = process.env.MONGO_URI;
const nombreBBDD = process.env.DDBB_NAME;
const adminNombre = process.env.ADMIN_NAME;
const adminPass = process.env.ADMIN_PASS;

async function conectarCliente(){    // funcion para conexion a cliente
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = mongoURI;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  return client;
}

async function listadoDatos(colecc) { // devuelve array de objetos con todos los datos de la coleccion deseada
  const cliente=await conectarCliente();
  try {
    const database = cliente.db(nombreBBDD);
    const datos = database.collection(colecc);
    const query = {};
    let dato = await datos.find(query).toArray();
    return dato;
  } finally {
    await cliente.close();
  }
}

async function insertarNuevoDocumento(nuevoDoc,colec) { // inserta nuevo documento en la coleccion
  const cliente=await conectarCliente();
  try {
    const database = cliente.db(nombreBBDD);
    const datos = database.collection(colec);
    await datos.insertOne(nuevoDoc);
  } finally {
    await cliente.close();
  }
}

async function modifEstado(coleccion,idkey,idvalue,estadokey,estadovalue) { // modificar estados de lo que sea
  const cliente=await conectarCliente();
  try {
    const database = cliente.db(nombreBBDD);
    const datos = database.collection(coleccion);
    datos.updateOne(
      { [idkey]:idvalue },
      { $set: { [estadokey]: estadovalue } }
    );
  } finally{
    await cliente.close();
  }
}

async function modifMenu(idvalue, primero, segundo, postre, bebida, titulo) { // modificar valores de menu, por id
  const cliente = await conectarCliente();
  try {
    const database = cliente.db(nombreBBDD);
    const datos = database.collection('menus');

    const query = { 'id': idvalue };

    const update = {
      $set: {
        'primero': primero,
        'segundo': segundo,
        'postre': postre,
        'bebida': bebida,
        'titulo': titulo
      }
    };

    const result = await datos.updateOne(query, update);
    //console.log(result);

    if (result.matchedCount === 0) {
      throw new Error(`No document, bitch: ${idvalue}`);
    }
  } finally {
    await cliente.close();
  }
}

async function cambiarDocuDeColecc(nombreKeyId,valorId,coleccOrigen,coleccDestino) {
  const cliente=await conectarCliente();
  try {
    const database = cliente.db(nombreBBDD);

      // Buscamos documento
      let origen = database.collection(coleccOrigen);
      let query = { [nombreKeyId]: valorId };
      let documento = await origen.findOne(query);

      // Lo metemos en la coleccion de destino
      let destino = database.collection(coleccDestino);
      await destino.insertOne(documento);

      // Lo borramos de la colecc de origen
      await origen.deleteOne(query);
  } catch (err) {
      console.error('Error:', err);
  } finally {
      await cliente.close();
  }
}

app.get("/", (req, res) => {
  res.json({
    message: "Escucha establecida con exito",
  })
})

// https://stackoverflow.com/questions/47523265/jquery-ajax-no-access-control-allow-origin-header-is-present-on-the-requested
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

/* GETS */

app.get('/api/menus',async(req, res)=>{  // mostrar todos los menus
  let menus=await listadoDatos('menus');
  res.json(menus);
});

app.get('/api/horas',async(req, res)=>{  // mostrar todas las horas de reserva (disponibles)
  let horas=await listadoDatos('horasDeReserva');
  let disponibles=[];
  horas.forEach((element) => {if(element.estado=='disponible'){disponibles.push(element)}});
  res.json(disponibles);
});

app.get('/api/horastodas',async(req, res)=>{  // mostrar todas las horas de reserva
  let horas=await listadoDatos('horasDeReserva');
  res.json(horas);
});

app.get('/api/pedidos',async(req, res)=>{  // mostrar todos los pedidos
  let pedidos=await listadoDatos('pedidos');
  res.json(pedidos);
});

app.get('/api/reservas',async(req, res)=>{  // mostrar todos las reservas
  let reservas=await listadoDatos('reservas');
  res.json(reservas);
});

app.get('/api/histpedidos',async(req, res)=>{  // mostrar historial pedidos
  let histPedidos=await listadoDatos('historialPedidos');
  res.json(histPedidos);
});

app.get('/api/histreservas',async(req, res)=>{  // mostrar historial reservas
  let histReservas=await listadoDatos('historialReservas');
  res.json(histReservas);
});

app.get('/api/histmenus',async(req, res)=>{  // mostrar historial menus
  let histReservas=await listadoDatos('historialMenus');
  res.json(histReservas);
});


/* POSTS */

//{"titulo":"nuevoTitulo","primero":"nuevoPrimero","segundo":"nuevoSegundo","postre":"nuevoPostre","bebida":"nuevaBebida"}
app.post('/api/nuevoMenu', async(req,res)=>{  // NUEVO MENU
  try{
    let nuevoIndice;
    let menusC=await listadoDatos('menus');

    if(menusC.length>0){  // calculamos nuevo indice, de esta manera no se rompe el flujo natural de ids si se borra un objeto
      let ultimo = menusC[menusC.length - 1];
      nuevoIndice=ultimo.id;
      nuevoIndice++;
    }else{
      nuevoIndice=(menusC.length);
      nuevoIndice++;
    }
    
    

    let nuevoTitulo=req.body.titulo;  // cojemos los valores para el nuevo dato
    let nuevoPrimero=req.body.primero;
    let nuevoSegundo=req.body.segundo;
    let nuevoPostre=req.body.postre;
    let nuevaBebida=req.body.bebida;

    let datoNuevo={
      "id":nuevoIndice.toString(),
      "titulo":nuevoTitulo,
      "primero":nuevoPrimero,
      "segundo":nuevoSegundo,
      "postre":nuevoPostre,
      "bebida":nuevaBebida
    };
    
    await insertarNuevoDocumento(datoNuevo,'menus') // actualizacion de BBDD, nuevo menu
    .then(() => console.log('Operacion realizada con exito'))
    .catch((error) => console.error('Error al introducir datos:', error));

    res.json({"mensaje":"Menu introducido correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

//{"idPedido":"valorDelIdDelMenuPedidoDeseado","codigoClientePersonal":"valorCCP"}
app.post('/api/nuevoPedido', async(req,res)=>{  // NUEVO PEDIDO
  try{
    let nuevoIndice;
    let pedidosC=await listadoDatos('pedidos');

    if(pedidosC.length>0){  // calculamos nuevo indice, de esta manera no se rompe el flujo natural de ids si se borra un objeto
      let ultimo = pedidosC[pedidosC.length - 1];
      nuevoIndice=ultimo.id;
      nuevoIndice++;
    }else{
      nuevoIndice=(pedidosC.length);
      nuevoIndice++;
    }

    let idPedido=req.body.idPedido;  // cojemos los valores para el nuevo dato
    let codigoClientePersonal=req.body.codigoClientePersonal;
    let estado='pendiente';


    let datoNuevo={
      "id":nuevoIndice.toString(),
      "idPedido":idPedido,
      "codigoClientePersonal":codigoClientePersonal,
      "estado":estado
    };
    
    await insertarNuevoDocumento(datoNuevo,'pedidos') // actualizacion de BBDD, nuevo pedido
    .then(() => console.log('Operacion realizada con exito'))
    .catch((error) => console.error('Error al introducir datos:', error)); 
    res.json({"mensaje":"Pedido enviado correctamente"});
  } catch (error) {
    res.status(500).json({ "mensaje": error.message });
  }
});

//{"horaReserva":"idDeHoraReservaDeseada","codigoClientePersonal":"valorCCP"}
app.post('/api/nuevaReserva', async(req,res)=>{  // NUEVA RESERVA
  try{
    let nuevoIndice;
    let pedidosC=await listadoDatos('reservas');

    if(pedidosC.length>0){  // calculamos nuevo indice, de esta manera no se rompe el flujo natural de ids si se borra un objeto
      let ultimo = pedidosC[pedidosC.length - 1];
      nuevoIndice=ultimo.id;
      nuevoIndice++;
    }else{
      nuevoIndice=(pedidosC.length);
      nuevoIndice++;
    }

    let horaReserva=req.body.horaReserva;  // cojemos los valores para el nuevo dato
    let codigoClientePersonal=req.body.codigoClientePersonal;
    let estado='pendiente';


    let datoNuevo={
      "id":nuevoIndice.toString(),
      "horaReserva":horaReserva,
      "codigoClientePersonal":codigoClientePersonal,
      "estado":estado
    };
    
    await insertarNuevoDocumento(datoNuevo,'reservas') // actualizacion de BBDD, nuevo pedido
    .then(() => console.log('Operacion realizada con exito'))
    .catch((error) => console.error('Error al introducir datos:', error)); 
    res.json({"mensaje":"Reserva enviada correctamente"});
  } catch (error) {
    res.status(500).json({ "mensaje": error.message });
  }
});

//{"coleccion":"nombreDeColeccion","idkey":"nombreCampoId","idvalue":"valorDeId","estadokey":"nombreCampoEstado","estadovalue":"valorDeNuevoEstado"}
app.post('/api/modEstado', async(req,res)=>{ // MODIFICAR ESTADO DE DOCUMENTO
  try{
    let coleccion=req.body.coleccion;
    let idkey=req.body.idkey;
    let idvalue=req.body.idvalue;
    let estadokey=req.body.estadokey;
    let estadovalue=req.body.estadovalue;

    modifEstado(coleccion,idkey,idvalue,estadokey,estadovalue);
    res.json({"mensaje":"Estado modificado correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

//{"idvalue":"idvalueDeMenuACambiar","primero":"primerPlato","segundo":"segundoPlato","postre":"postre","bebida":"bebida","titulo":"descripcionDelMenu"}
app.post('/api/modifMenu', async(req,res)=>{ // MODIFICAR VALORES DE MENU
  try{
    let idvalue=req.body.idvalue;
    let primero=req.body.primero;
    let segundo=req.body.segundo;
    let postre=req.body.postre;
    let bebida=req.body.bebida;
    let titulo=req.body.titulo;

    await modifMenu(idvalue,primero,segundo,postre,bebida,titulo);
    res.json({"mensaje":"Menu modificado correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

//{"idkey":"nombreCampoId","idvalue":"valorDeId","coleccOrigen":"nombreColeccOriginal","coleccDestino":"nombreColeccDestino"}
app.post('/api/moverDocumento', async(req,res)=>{ // MOVER A OTRA COLECCION Y BORRAR DE LA ORIGINAL
  try{
    let idkey=req.body.idkey;
    let idvalue=req.body.idvalue;
    let coleccOrigen=req.body.coleccOrigen;
    let coleccDestino=req.body.coleccDestino;

    await cambiarDocuDeColecc(idkey,idvalue,coleccOrigen,coleccDestino);
    res.json({"mensaje":"Documento trasladado correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

//{"nombre":"nombreCampo","password":"passwordCampo"}
app.post('/api/checkAdmin', async(req,res)=>{ // ADMIN CHECK
  try{
    let name=req.body.nombre;
    let pass=req.body.password;

    if(name==adminNombre && pass==adminPass){
      res.json({"mensaje":"FUCK YEAH"});
    }else{
      res.json({"mensaje":"FUCK NO"});
    }

    
  }catch(error){
    res.send({"mensaje":error});
  }
});

module.exports = app;

