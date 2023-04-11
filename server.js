/*********************************************************************************
 *  WEB700 – Assignment 05
 *  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part
 *  of this assignment has been copied manually or electronically from any other source
 *  (including 3rd party web sites) or distributed to other students.
 *
 *  Name: Aileen Valdecantos______ Student ID: 112040225______ Date: 3/26/2023______
 *
 *  Online (Cycliic) Link: https://shy-ruby-coral-hose.cyclic.app/ _________
 *
 ********************************************************************************/

var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
const cd = require("./modules/collegeData.js");
const path = require("path");
const exphbs = require("express-handlebars");

// exphbs engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
      navLink: function (url, options) {
        return (
          "<li" +
          (url == app.locals.activeRoute
            ? ' class="nav-item active" '
            : ' class="nav-item" ') +
          '><a class="nav-link" href="' +
          url +
          '">' +
          options.fn(this) +
          "</a></li>"
        );
      },
      equal: function (lvalue, rvalue, options) {
        if (arguments.length < 3)
          throw new Error("Handlebars Helper equal needs 2 parameters");
        if (lvalue != rvalue) {
          return options.inverse(this);
        } else {
          return options.fn(this);
        }
      },
    },
  })
);

// specify the view engine
app.set("view engine", "hbs");

// Navigation bar
app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    "/" +
    (isNaN(route.split("/")[1])
      ? route.replace(/\/(?!.*)/, "")
      : route.replace(/\/(.*)/, ""));
  next();
});

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

app.get("/students/add", (req, res) => {
  cd.getCourses()
    .then((data) => {
      res.render("addStudent", { courses: data });
    })
    .catch((err) => {
      console.log(err);
      res.render("addStudent", { courses: [] });
    });
});

app.post("/students/add", (req, res) => {
  const studentData = req.body;
  cd.addStudent(studentData)
    .then(() => {
      res.redirect("/students");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.get("/courses/add", (req, res) => {
  res.render("addCourse");
});

app.post("/courses/add", (req, res) => {
  const courseData = req.body;
  cd.addCourse(courseData)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.post("/course/update", (req, res) => {
  const courseData = req.body;
  cd.updateCourse(courseData)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/htmlDemo", (req, res) => {
  res.render("htmlDemo");
});

app.get("/students", async (req, res) => {
  try {
    if (req.query.course) {
      const course = parseInt(req.query.course);
      if (isNaN(course) || course < 1 || course > 7) {
        throw new Error("Invalid course number");
      }
      const students = await cd.getStudentsByCourse(course);
      res.render("students", {
        students,
      });
    } else {
      const students = await cd.getAllStudents();
      res.render("students", {
        students,
      });
    }
  } catch (error) {
    res.render("students", {
      message: "no results",
    });
  }
});
app.get("/tas", async (req, res) => {
  try {
    const managers = await cd.getTAs();
    res.json(managers);
  } catch (error) {
    res.status(500).json({
      message: "no results",
    });
  }
});

app.get("/courses", async (req, res) => {
  try {
    const courses = await cd.getCourses();
    res.render("courses", {
      courses,
    });
  } catch (error) {
    res.render("courses", {
      message: "no results",
    });
  }
});

app.get("/course/:id", (req, res) => {
  const id = req.params.id;
  cd.getCourseById(id)
    .then((course) => {
      if (!course) {
        res.status(404).send("Course Not Found");
      } else {
        res.render("course", { course: course });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Internal server error");
    });
});

app.get("/course/delete/:id", (req, res) => {
  const id = req.params.id;
  cd.deleteCourseById(id)
    .then(() => {
      res.redirect("/courses");
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Unable to Remove Course / Course not found");
    });
});

app.get("/student/:studentNum", (req, res) => {
  // initialize an empty object to store the values
  let viewData = {};

  cd
    .getStudentByNum(req.params.studentNum)
    .then((cd) => {
      if (cd) {
        viewData.student = cd; //store student data in the "viewData" object as "student"
      } else {
        viewData.student = null; // set student to null if none were returned
      }
    })
    .catch(() => {
      viewData.student = null; // set student to null if there was an error
    })
    .then(cd.getCourses)
    .then((cd) => {
      viewData.courses = cd; // store course data in the "viewData" object as "courses"

      // loop through viewData.courses and once we have found the courseId that matches
      // the student's "course" value, add a "selected" property to the matching
      // viewData.courses object

      for (let i = 0; i < viewData.courses.length; i++) {
        if (viewData.courses[i].courseId == viewData.student.course) {
          viewData.courses[i].selected = true;
        }
      }
    })
    .catch(() => {
      viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
      if (viewData.student == null) {
        // if no student - return an error
        res.status(404).send("Student Not Found");
      } else {
        res.render("student", { viewData: viewData }); // render the "student" view
      }
    });
});

app.post("/student/update", async (req, res) => {
  const updatedData = req.body;
  await cd
    .updateStudent(updatedData)
    .then(() => res.redirect("/students"))
    .catch((error) => {
      console.error(error);
      res.status(500).send("Failed to update student");
    });
});

app.get("/students/delete/:studentNum", async (req, res) => {
  const studentNum = req.params.studentNum;

  try {
    await cd.deleteStudentByNum(studentNum);
    res.redirect("/students");
  } catch (error) {
    res.status(500).send("Unable to Remove Student / Student not found");
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Page Not Found");
});

cd.initialize()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("server listening on port: " + HTTP_PORT);
    });
  })
  .catch((error) => {
    console.error(`Error initializing data: ${error}`);
  });
