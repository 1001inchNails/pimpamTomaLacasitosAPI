/*
TO DO: hacer funciones(?) y endpoints para modificar estados de reservas, pedidos y horasDeReserva. Hacer horasDeReserva (hardcoded)

-Funcionalidad-
menus: creacion de nuevos , visionado
pedidos: creacion de nuevos, visionado, modificacion de estado (pendiente)
reservas: creacion de nuevos, visionado, modificacion de estado (pendiente)
horasDeReserva: visionado (los que esten disponibles), modificacion de estado (pendiente)
*/
const express = require('express');


const app = express();


app.use(express.json());


async function conectarCliente(){    // funcion para conexion a cliente...
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = "mongodb+srv://dccAtlMongoC_S:1001%25%25wWqq4904@clusterbuster.bl5p1.mongodb.net/?retryWrites=true&w=majority&appName=ClusterBuster";
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  return client;
}

async function listadoDatos(colecc) { // devuelve array de objetos con todos los datos
  const cliente=await conectarCliente();
  try {
    const database = cliente.db('despliegueGITrestaurante');
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
    const database = cliente.db('despliegueGITrestaurante');
    const datos = database.collection(colec);
    await datos.insertOne(nuevoDoc);
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



app.get('/api/menus',async(req, res)=>{  // mostrar todos los menus
  let menus=await listadoDatos('menus');
  res.json(menus);
});


app.get('/api/horas',async(req, res)=>{  // mostrar todos las horas de reserva (disponibles)
  let horas=await listadoDatos('horasDeReseva');
  let disponibles=[];
  horas.forEach((element) => {if(element.estado=='disponible'){disponibles.push(element)}});
  res.json(disponibles)
});

app.get('/api/pedidos',async(req, res)=>{  // mostrar todos los pedidos
  let pedidos=await listadoDatos('pedidos');
  res.json(pedidos);
});

app.get('/api/reservas',async(req, res)=>{  // mostrar todos las reservas
  let reservas=await listadoDatos('reservas');
  res.json(reservas);
});
/*
app.get('/api/users/:nombre', async(req, res)=>{  // busqueda por nombre
  let resultado=[];
  let usuariosB=await listadoUsers();
  let userNombre=req.params.nombre;
  userNombre.toLowerCase();
  for(let usuario of usuariosB){
    if(usuario['nombre'].toLowerCase().includes(userNombre.toLowerCase())){
      resultado.push(usuario);
    }
  }
  if(resultado.length>0){
    res.json(resultado);
  }
  else if(resultado.length==0){
    res.json({"mensaje":"No se han encontrado coincidencias"})
  }
  else{
    res.status(404).json(({error:"Error, madafaka"}));
  }
});
*/

app.post('/api/nuevoMenu', async(req,res)=>{  // NUEVO MENU
  try{
    let menusC=await listadoDatos('menus');
    let nuevoIndice=(menusC.length);  // calculamos nuevo indice
    nuevoIndice++;
    nuevoIndice.toString();

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
      "bebida":nuevaBebida,
    };
    
    await insertarNuevoDocumento(datoNuevo,'menus') // actualizacion de BBDD, nuevo menu
    .then(() => console.log('Datos introducidos correctamente'))
    .catch((error) => console.error('Error al introducir datos:', error)); 
    res.json({"mensaje":"Usuario introducido correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

app.post('/api/nuevoPedido', async(req,res)=>{  // NUEVO PEDIDO
  try{
    let pedidosC=await listadoDatos('pedidos');
    let indice=(pedidosC.length);  // calculamos nuevo indice
    indice++;
    indice.toString();

    let idPedido=req.body.idPedido;  // cojemos los valores para el nuevo dato
    let codigoClientePersonal=req.body.codigoClientePersonal;
    let estado='pendiente';


    let datoNuevo={
      "id":indice.toString(),
      "idPedido":idPedido,
      "codigoClientePersonal":codigoClientePersonal,
      "estado":estado
    };
    
    await insertarNuevoDocumento(datoNuevo,'pedidos') // actualizacion de BBDD, nuevo pedido
    .then(() => console.log('Datos introducidos correctamente'))
    .catch((error) => console.error('Error al introducir datos:', error)); 
    res.json({"mensaje":"Usuario introducido correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

app.post('/api/nuevaReserva', async(req,res)=>{  // NUEVA RESERVA
  try{
    let pedidosC=await listadoDatos('reservas');
    let indice=(pedidosC.length);  // calculamos nuevo indice
    indice++;
    indice.toString();

    let horaReserva=req.body.horaReserva;  // cojemos los valores para el nuevo dato
    let codigoClientePersonal=req.body.codigoClientePersonal;
    let estado='pendiente';


    let datoNuevo={
      "id":indice.toString(),
      "horaReserva":horaReserva,
      "codigoClientePersonal":codigoClientePersonal,
      "estado":estado
    };
    
    await insertarNuevoDocumento(datoNuevo,'pedidos') // actualizacion de BBDD, nuevo pedido
    .then(() => console.log('Datos introducidos correctamente'))
    .catch((error) => console.error('Error al introducir datos:', error)); 
    res.json({"mensaje":"Usuario introducido correctamente"});
  }catch(error){
    res.send({"mensaje":error});
  }
});

module.exports = app;

