import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.ImporterTopLevel;

/**
 * Tiny Rhino-API driver used by scripts/rhino-compat.mjs.
 *
 * Args:
 *   <probesFile>          path to the JavaScript probe suite to run under Rhino
 *   <languageVersionInt>  Rhino Context language version (0=VERSION_DEFAULT,
 *                         180=VERSION_1_8, 200=VERSION_ES6)
 *
 * Emits to stdout:
 *   IMPL\t<Context.getImplementationVersion()>
 *   VERSION\t<arg>
 *   ...whatever the probe suite prints (RESULT lines)...
 *   FATAL\t<msg>   only if the whole evaluation blows up
 */
public class RunProbes {

    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("FATAL\tusage: RunProbes <probesFile> <languageVersionInt>");
            return;
        }

        String probesFile = args[0];
        int languageVersion;
        try {
            languageVersion = Integer.parseInt(args[1].trim());
        } catch (NumberFormatException e) {
            System.out.println("FATAL\tbad languageVersion arg: " + args[1]);
            return;
        }

        Context cx = Context.enter();
        try {
            cx.setLanguageVersion(languageVersion);
            cx.setOptimizationLevel(-1);

            // ImporterTopLevel initializes the standard objects AND provides
            // importPackage()/importClass(), which Mirth's script scope also exposes.
            Scriptable scope = new ImporterTopLevel(cx);

            // Define a global print(...) that writes a single space-joined line to stdout.
            Function printFn = new BaseFunction() {
                @Override
                public Object call(Context cx2, Scriptable scope2, Scriptable thisObj, Object[] fnArgs) {
                    StringBuilder sb = new StringBuilder();
                    for (int i = 0; i < fnArgs.length; i++) {
                        if (i > 0) {
                            sb.append(" ");
                        }
                        sb.append(Context.toString(fnArgs[i]));
                    }
                    System.out.println(sb.toString());
                    return Context.getUndefinedValue();
                }
            };
            ScriptableObject.putProperty(scope, "print", printFn);

            // Emit identifying lines BEFORE running the probes.
            System.out.println("IMPL\t" + cx.getImplementationVersion());
            System.out.println("VERSION\t" + languageVersion);

            String source;
            try {
                source = new String(Files.readAllBytes(Paths.get(probesFile)));
            } catch (IOException e) {
                System.out.println("FATAL\tcould not read probes file: " + e.getMessage());
                return;
            }

            try {
                cx.evaluateString(scope, source, probesFile, 1, null);
            } catch (Throwable t) {
                System.out.println("FATAL\t" + t.getClass().getName() + ": " + t.getMessage());
            }
        } catch (Throwable t) {
            System.out.println("FATAL\t" + t.getClass().getName() + ": " + t.getMessage());
        } finally {
            Context.exit();
        }
    }
}
