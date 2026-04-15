import app from "./app/app";

const PORT = process.env.PORT || 4003;

app.listen(PORT, () => {
  console.log(`Format service listening on port ${PORT}`);
});
