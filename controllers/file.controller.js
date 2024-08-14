"use strict";

const fs = require("fs");
const path = require("path");
const { File } = require("../models");

const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
exports.createFile = async (req, res) => {
  try {
    console.log("User object:", req.user);
    const userId = req.user.id;

    req.pipe(req.busboy);

    req.busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const name = filename; 
      const filePath = path.join(UPLOAD_DIR, `${Date.now()}-${filename}`);
      const fileData = [];

      file.on("data", (data) => {
        fileData.push(data);
      });

      file.on("end", async () => {
        const fullPath = path.join(UPLOAD_DIR, `${Date.now()}-${filename}`);
        fs.writeFileSync(fullPath, Buffer.concat(fileData));
        
        console.log("info", {
          name: name,
          type: mimetype, 
          path: fullPath,
          userId: userId,
        });

        try {
          const newFile = await File.create({
            name: name.toString(), 
            type: mimetype ? mimetype.toString() : '', 
            path: fullPath.toString(), 
            userId: userId,
          });

          res.status(201).json({
            status: "Success",
            message: "File created successfully",
            data: newFile,
          });
        } catch (error) {
          console.error("Database error:", error);
          res.status(500).json({ error: "Failed to create file in database" });
        }
      });
    });

    req.busboy.on("finish", () => {
    });
  } catch (error) {
    console.error("File handling error:", error);
    res.status(500).json({ error: "Failed to create file" });
  }
};


exports.getAll = async (req, res) => {
  try {
    const data = await File.findAll();
    res.status(200).send({
      status: "Success",
      messages: "Data retrieved",
      data: data,
    });
  } catch (err) {
    return res.status(500).send({
      status: "Error",
      message: err.message,
    });
  }
};
exports.get = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    res.status(200).json({
      status: "Success",
      message: "File retrieved successfully",
      data: file,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to retrieve file" });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    if (req.files && req.files.file) {
      fs.unlinkSync(path.resolve(file.path));
      const updatedFilePath = path.join(
        UPLOAD_DIR,
        `${Date.now()}-${req.files.file.name}`
      );
      fs.writeFileSync(updatedFilePath, req.files.file.data);
      file.path = updatedFilePath;
    }

    file.name = name || file.name;
    file.type = type || file.type;

    await file.save();

    res.status(200).json({
      status: "Success",
      message: "File updated successfully",
      data: file,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update file" });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    fs.unlinkSync(path.resolve(file.path));

    await file.destroy();

    res.status(200).json({
      status: "Success",
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete file" });
  }
};
