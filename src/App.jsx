import "./App.css";
import {
  FormControl,
  InputGroup,
  Container,
  Button,
  Card,
  Row,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useState, useEffect } from "react";

const clientId = import.meta.env.VITE_CLIENT_ID;
const clientSecret = import.meta.env.VITE_CLIENT_SECRET;

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [artistInfo, setArtistInfo] = useState(null);

  useEffect(() => {
    console.log("🔑 Intentando obtener token...");
    console.log("Client ID:", clientId ? "✓ Configurado" : "❌ No encontrado");
    console.log("Client Secret:", clientSecret ? "✓ Configurado" : "❌ No encontrado");
    
    let authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        clientId +
        "&client_secret=" +
        clientSecret,
    };

    fetch("https://accounts.spotify.com/api/token", authParams)
      .then((result) => result.json())
      .then((data) => {
        console.log("📡 Respuesta de Spotify:", data);
        if (data.access_token) {
          console.log("✅ Token obtenido correctamente");
          setAccessToken(data.access_token);
        } else {
          console.log("❌ No se recibió token:", data);
          setError("Error al obtener token de Spotify");
        }
      })
      .catch((err) => {
        console.log("💥 Error en autenticación:", err);
        setError("Error de conexión con Spotify");
        console.error(err);
      });
  }, []);

  async function search() {
    if (!searchInput.trim()) {
      setError("Por favor ingresa el nombre de un artista");
      return;
    }

    console.log("🔍 Iniciando búsqueda para:", searchInput);
    console.log("🎫 Token disponible:", accessToken ? "✓" : "❌");

    setLoading(true);
    setError("");
    setAlbums([]);
    setArtistInfo(null);

    try {
      let artistParams = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
        },
      };

      console.log("📡 Buscando artista...");
      // Get Artist
      const artistResponse = await fetch(
        "https://api.spotify.com/v1/search?q=" + encodeURIComponent(searchInput) + "&type=artist",
        artistParams
      );
      
      console.log("📊 Status de respuesta:", artistResponse.status);
      const artistData = await artistResponse.json();
      console.log("🎤 Datos del artista:", artistData);
      
      if (!artistData.artists.items || artistData.artists.items.length === 0) {
        setError("No se encontró el artista. Intenta con otro nombre.");
        setLoading(false);
        return;
      }

      const artist = artistData.artists.items[0];
      console.log("✅ Artista encontrado:", artist.name);
      setArtistInfo(artist);

      console.log("💿 Buscando álbumes...");
      // Get Artist Albums
      const albumsResponse = await fetch(
        "https://api.spotify.com/v1/artists/" +
          artist.id +
          "/albums?include_groups=album&market=US&limit=50",
        artistParams
      );
      
      console.log("📊 Status álbumes:", albumsResponse.status);
      const albumsData = await albumsResponse.json();
      console.log("💿 Álbumes encontrados:", albumsData.items?.length || 0);
      setAlbums(albumsData.items || []);
      
    } catch (err) {
      console.log("💥 Error completo:", err);
      setError("Error al buscar. Intenta nuevamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Container className="mt-4">
        <h1 className="text-center mb-4">🎵 Spotify Artist Finder</h1>
        
        <InputGroup className="mb-4">
          <FormControl
            placeholder="Search For Artist"
            type="input"
            aria-label="Search for an Artist"
            value={searchInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                search();
              }
            }}
            onChange={(event) => setSearchInput(event.target.value)}
            style={{
              height: "35px",
              borderRadius: "5px",
              marginRight: "10px",
              paddingLeft: "10px",
            }}
          />
          <Button onClick={search} disabled={loading || !accessToken}>
            {loading ? <Spinner size="sm" /> : "Search"}
          </Button>
        </InputGroup>

        {error && (
          <Alert variant="danger" onClose={() => setError("")} dismissible>
            {error}
          </Alert>
        )}

        {artistInfo && (
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex align-items-center">
                {artistInfo.images && artistInfo.images[0] && (
                  <img 
                    src={artistInfo.images[0].url} 
                    alt={artistInfo.name}
                    style={{ width: "100px", height: "100px", borderRadius: "50%", marginRight: "20px" }}
                  />
                )}
                <div>
                  <h3>{artistInfo.name}</h3>
                  <p>👥 {artistInfo.followers?.total.toLocaleString()} seguidores</p>
                  <p>⭐ Popularidad: {artistInfo.popularity}/100</p>
                  {artistInfo.genres && artistInfo.genres.length > 0 && (
                    <p>🎼 Géneros: {artistInfo.genres.slice(0, 3).join(", ")}</p>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

        {loading && (
          <div className="text-center">
            <Spinner animation="border" />
            <p>Buscando álbumes...</p>
          </div>
        )}

        <Container>
          <Row
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-around",
              alignContent: "center",
            }}
          >
            {albums.map((album) => {
              return (
                <Card
                  key={album.id}
                  style={{
                    backgroundColor: "white",
                    margin: "10px",
                    borderRadius: "5px",
                    marginBottom: "30px",
                    maxWidth: "250px"
                  }}
                >
                  {album.images && album.images[0] && (
                    <Card.Img
                      src={album.images[0].url}
                      style={{
                        borderRadius: "4%",
                        height: "200px",
                        objectFit: "cover"
                      }}
                    />
                  )}
                  <Card.Body>
                    <Card.Title
                      style={{
                        fontWeight: "bold",
                        fontSize: "16px",
                        marginTop: "10px",
                        color: "black",
                        height: "50px",
                        overflow: "hidden"
                      }}
                    >
                      {album.name}
                    </Card.Title>
                    <Card.Text
                      style={{
                        color: "gray",
                        fontSize: "14px"
                      }}
                    >
                      📅 {album.release_date}<br/>
                      🎵 {album.total_tracks} canciones
                    </Card.Text>
                    <Button
                      href={album.external_urls.spotify}
                      target="_blank"
                      style={{
                        backgroundColor: "#1db954",
                        border: "none",
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "14px",
                        borderRadius: "20px",
                        padding: "8px 16px",
                        width: "100%"
                      }}
                    >
                      Abrir en Spotify
                    </Button>
                  </Card.Body>
                </Card>
              );
            })}
          </Row>
        </Container>
      </Container>
    </>
  );
}

export default App;